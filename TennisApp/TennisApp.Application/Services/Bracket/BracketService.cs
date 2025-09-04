using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TennisApp.Application.DTOs.Bracket;
using TennisApp.Domain.Entities;
using TennisApp.Domain.Enums;
using TennisApp.Infrastructure.Data;

namespace TennisApp.Application.Services.Bracket;

public class BracketService : IBracketService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<BracketService> _logger;

    public BracketService(AppDbContext context, IMapper mapper, ILogger<BracketService> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<BracketDto> GenerateBracketAsync(GenerateBracketDto generateDto)
    {
        _logger.LogInformation("Generating bracket for tournament {TournamentId}", generateDto.TournamentId);

        // Validate tournament exists
        var tournament = await _context.Tournaments
            .Include(t => t.TournamentPlayers)
            .ThenInclude(r => r.Player)
            .FirstOrDefaultAsync(t => t.Id == generateDto.TournamentId);

        if (tournament == null)
        {
            throw new ArgumentException($"Tournament {generateDto.TournamentId} not found");
        }

        // Validate draw size
        if (!IsValidDrawSize(generateDto.DrawSize))
        {
            throw new ArgumentException($"Invalid draw size {generateDto.DrawSize}. Must be 16, 32, 64, or 128");
        }

        // Get registered and checked-in players
        var eligiblePlayers = tournament.TournamentPlayers
            .Where(r => r.Status == RegistrationStatus.CheckedIn)
            .Select(r => r.Player)
            .ToList();

        if (eligiblePlayers.Count() > generateDto.DrawSize)
        {
            throw new InvalidOperationException($"Too many players ({eligiblePlayers.Count()}) for draw size ({generateDto.DrawSize})");
        }

        // Delete existing bracket if it exists
        var existingBracket = await _context.Set<Domain.Entities.Bracket>()
            .FirstOrDefaultAsync(b => b.TournamentId == generateDto.TournamentId && 
                                     b.BracketType == generateDto.BracketType);
        
        if (existingBracket != null)
        {
            _context.Set<Domain.Entities.Bracket>().Remove(existingBracket);
        }

        // Create new bracket
        var bracket = new Domain.Entities.Bracket
        {
            TournamentId = generateDto.TournamentId,
            BracketType = generateDto.BracketType,
            DrawSize = generateDto.DrawSize,
            TotalRounds = CalculateTotalRounds(generateDto.DrawSize),
            GeneratedAt = DateTime.UtcNow,
            GeneratedBy = "System"
        };

        _context.Set<Domain.Entities.Bracket>().Add(bracket);
        await _context.SaveChangesAsync();

        // Generate bracket nodes
        var nodes = GenerateBracketNodes(bracket, eligiblePlayers, generateDto);
        _context.Set<BracketNode>().AddRange(nodes);
        await _context.SaveChangesAsync();

        // Load the complete bracket with nodes
        var completeBracket = await _context.Set<Domain.Entities.Bracket>()
            .Include(b => b.Nodes)
            .ThenInclude(n => n.Player)
            .FirstAsync(b => b.Id == bracket.Id);

        return _mapper.Map<BracketDto>(completeBracket);
    }

    private List<BracketNode> GenerateBracketNodes(Domain.Entities.Bracket bracket, 
        List<Domain.Entities.Player> players, GenerateBracketDto generateDto)
    {
        var nodes = new List<BracketNode>();
        var totalPositions = bracket.DrawSize;
        
        // Create first round nodes
        for (int i = 1; i <= bracket.DrawSize; i++)
        {
            nodes.Add(new BracketNode
            {
                BracketId = bracket.Id,
                Position = i,
                Round = 1,
                WinnerNodePosition = CalculateWinnerPosition(i, 1, bracket.DrawSize)
            });
        }

        // Create nodes for subsequent rounds
        int currentRoundSize = bracket.DrawSize / 2;
        int positionOffset = bracket.DrawSize;
        
        for (int round = 2; round <= bracket.TotalRounds; round++)
        {
            for (int i = 1; i <= currentRoundSize; i++)
            {
                nodes.Add(new BracketNode
                {
                    BracketId = bracket.Id,
                    Position = positionOffset + i,
                    Round = round,
                    WinnerNodePosition = round < bracket.TotalRounds ? 
                        CalculateWinnerPosition(positionOffset + i, round, bracket.DrawSize) : null
                });
            }
            positionOffset += currentRoundSize;
            currentRoundSize /= 2;
        }

        // Assign players to first round positions
        if (generateDto.AutoSeed)
        {
            AssignSeededPlayers(nodes, players, bracket.DrawSize);
        }
        else if (generateDto.ManualSeeds != null)
        {
            AssignManualSeeds(nodes, players, generateDto.ManualSeeds);
        }

        return nodes;
    }

    private void AssignSeededPlayers(List<BracketNode> nodes, List<Domain.Entities.Player> players, int drawSize)
    {
        // Sort players by ranking (assuming lower ranking number is better)
        var rankedPlayers = players
            .OrderBy(p => p.Rankings != null && p.Rankings.Any() ? p.Rankings.First().Position : int.MaxValue)
            .ToList();

        // Get seeding positions based on draw size
        var seedingOrder = GetSeedingOrder(drawSize);
        
        // Assign seeded players
        int seedNumber = 1;
        foreach (var position in seedingOrder)
        {
            if (seedNumber > rankedPlayers.Count())
                break;

            var node = nodes.First(n => n.Round == 1 && n.Position == position);
            var player = rankedPlayers[seedNumber - 1];
            
            node.PlayerId = player.Id;
            node.Seed = seedNumber;
            
            seedNumber++;
        }

        // Mark remaining positions as byes if not enough players
        var firstRoundNodes = nodes.Where(n => n.Round == 1 && n.PlayerId == null).ToList();
        var byesNeeded = drawSize - players.Count();
        
        // Distribute byes evenly
        if (byesNeeded > 0)
        {
            var byePositions = GetByePositions(drawSize, byesNeeded);
            foreach (var position in byePositions)
            {
                var node = nodes.First(n => n.Round == 1 && n.Position == position);
                node.IsBye = true;
            }
        }
    }

    private void AssignManualSeeds(List<BracketNode> nodes, List<Domain.Entities.Player> players, 
        List<ManualSeedDto> manualSeeds)
    {
        foreach (var manualSeed in manualSeeds)
        {
            var player = players.FirstOrDefault(p => p.Id == manualSeed.PlayerId);
            if (player == null) continue;

            var seedPosition = GetPositionForSeed(manualSeed.Seed, nodes.Count(n => n.Round == 1));
            var node = nodes.FirstOrDefault(n => n.Round == 1 && n.Position == seedPosition);
            
            if (node != null)
            {
                node.PlayerId = player.Id;
                node.Seed = manualSeed.Seed;
            }
        }
    }

    private List<int> GetSeedingOrder(int drawSize)
    {
        // Returns the order in which seeds should be placed in the bracket
        // This ensures proper separation of top seeds
        return drawSize switch
        {
            16 => new List<int> { 1, 16, 9, 8, 5, 12, 13, 4, 3, 14, 11, 6, 7, 10, 15, 2 },
            32 => new List<int> { 1, 32, 17, 16, 9, 24, 25, 8, 5, 28, 21, 12, 13, 20, 29, 4,
                                  3, 30, 19, 14, 11, 22, 27, 6, 7, 26, 23, 10, 15, 18, 31, 2 },
            64 => GenerateSeedingOrderForSize(64),
            128 => GenerateSeedingOrderForSize(128),
            _ => new List<int>()
        };
    }

    private List<int> GenerateSeedingOrderForSize(int size)
    {
        // Generate seeding order for larger draw sizes
        // The pattern ensures proper tennis bracket seeding where:
        // - Seed 1 goes to position 1
        // - Seed 2 goes to the last position in the draw (e.g., 64 for a 64-draw)
        // - Position 2 gets the weakest seed (appears last in the seeding order)
        var order = new List<int>();
        var reserved = new HashSet<int> { 2 }; // Reserve position 2 for last
        
        // Use the recursive algorithm but skip position 2
        GenerateSeedingRecursiveWithReserved(1, size, order, reserved);
        
        // Add position 2 at the very end (for the weakest seed)
        order.Add(2);
        
        return order;
    }
    
    private void GenerateSeedingRecursiveWithReserved(int start, int end, List<int> order, HashSet<int> reserved)
    {
        if (start > end) return;
        
        // Skip reserved positions
        while (reserved.Contains(start) && start <= end)
            start++;
        while (reserved.Contains(end) && end >= start)
            end--;
            
        if (start > end) return;
        
        // Add the first position
        order.Add(start);
        
        // If not the same, add the last position
        if (start < end)
        {
            order.Add(end);
            
            // Recursively process the two halves
            if (end - start > 1)
            {
                int mid = (start + end) / 2;
                
                // Process upper half
                GenerateSeedingRecursiveWithReserved(start + 1, mid, order, reserved);
                
                // Process lower half
                GenerateSeedingRecursiveWithReserved(mid + 1, end - 1, order, reserved);
            }
        }
    }

    private List<int> GetByePositions(int drawSize, int byesNeeded)
    {
        // Distribute byes to balance the bracket
        // Byes should be placed against lower seeds
        var positions = new List<int>();
        var seedingOrder = GetSeedingOrder(drawSize);
        
        // Place byes against the lowest seeds
        for (int i = drawSize - 1; i >= 0 && positions.Count < byesNeeded; i--)
        {
            positions.Add(seedingOrder[i]);
        }
        
        return positions;
    }

    private int GetPositionForSeed(int seed, int drawSize)
    {
        var seedingOrder = GetSeedingOrder(drawSize);
        return seed <= seedingOrder.Count ? seedingOrder[seed - 1] : seed;
    }

    private int? CalculateWinnerPosition(int currentPosition, int currentRound, int drawSize)
    {
        // Calculate which position the winner advances to
        if (currentRound >= CalculateTotalRounds(drawSize))
            return null;

        // For first round, positions 1-2 go to position drawSize+1, 3-4 go to drawSize+2, etc.
        if (currentRound == 1)
        {
            return drawSize + ((currentPosition + 1) / 2);
        }

        // For other rounds, follow similar pattern
        var positionsInRound = drawSize / (int)Math.Pow(2, currentRound - 1);
        var positionInRound = currentPosition - GetPositionOffset(currentRound, drawSize) + 1;
        var nextRoundOffset = GetPositionOffset(currentRound + 1, drawSize);
        
        return nextRoundOffset + ((positionInRound + 1) / 2);
    }

    private int GetPositionOffset(int round, int drawSize)
    {
        if (round == 1) return 0;
        
        int offset = 0;
        for (int r = 1; r < round; r++)
        {
            offset += drawSize / (int)Math.Pow(2, r - 1);
        }
        return offset;
    }

    private int CalculateTotalRounds(int drawSize)
    {
        return (int)Math.Log2(drawSize);
    }

    private bool IsValidDrawSize(int size)
    {
        return size == 16 || size == 32 || size == 64 || size == 128;
    }

    public async Task<BracketDto?> GetBracketAsync(int tournamentId, string bracketType = "Main")
    {
        var bracket = await _context.Set<Domain.Entities.Bracket>()
            .Include(b => b.Nodes)
            .ThenInclude(n => n.Player)
            .FirstOrDefaultAsync(b => b.TournamentId == tournamentId && b.BracketType == bracketType);

        return bracket != null ? _mapper.Map<BracketDto>(bracket) : null;
    }

    public async Task<BracketDto?> GetBracketByIdAsync(int bracketId)
    {
        var bracket = await _context.Set<Domain.Entities.Bracket>()
            .Include(b => b.Nodes)
            .ThenInclude(n => n.Player)
            .FirstOrDefaultAsync(b => b.Id == bracketId);

        return bracket != null ? _mapper.Map<BracketDto>(bracket) : null;
    }

    public async Task<BracketVisualizationDto?> GetBracketVisualizationAsync(int tournamentId, string bracketType = "Main")
    {
        var bracket = await _context.Set<Domain.Entities.Bracket>()
            .Include(b => b.Tournament)
            .Include(b => b.Nodes)
            .ThenInclude(n => n.Player)
            .Include(b => b.Nodes)
            .ThenInclude(n => n.Match)
            .FirstOrDefaultAsync(b => b.TournamentId == tournamentId && b.BracketType == bracketType);

        if (bracket == null)
            return null;

        var visualization = new BracketVisualizationDto
        {
            TournamentId = bracket.TournamentId,
            TournamentName = bracket.Tournament.Name,
            BracketType = bracket.BracketType,
            DrawSize = bracket.DrawSize,
            Rounds = new List<RoundDto>()
        };

        // Build rounds
        for (int round = 1; round <= bracket.TotalRounds; round++)
        {
            var roundNodes = bracket.Nodes.Where(n => n.Round == round).OrderBy(n => n.Position).ToList();
            var roundDto = new RoundDto
            {
                RoundNumber = round,
                RoundName = GetRoundName(round, bracket.TotalRounds),
                Matchups = new List<MatchupDto>()
            };

            // Pair up nodes for matchups
            for (int i = 0; i < roundNodes.Count; i += 2)
            {
                var topNode = roundNodes[i];
                var bottomNode = i + 1 < roundNodes.Count ? roundNodes[i + 1] : null;

                var matchup = new MatchupDto
                {
                    Position = i / 2 + 1,
                    MatchId = topNode.MatchId,
                    WinnerPosition = topNode.WinnerNodePosition
                };

                if (topNode != null)
                {
                    matchup.TopPlayer = new PlayerSlotDto
                    {
                        PlayerId = topNode.PlayerId,
                        PlayerName = topNode.Player != null ? $"{topNode.Player.FirstName} {topNode.Player.LastName}" : null,
                        Seed = topNode.Seed,
                        IsBye = topNode.IsBye,
                        IsWinner = false // Will be determined by match result
                    };
                }

                if (bottomNode != null)
                {
                    matchup.BottomPlayer = new PlayerSlotDto
                    {
                        PlayerId = bottomNode.PlayerId,
                        PlayerName = bottomNode.Player != null ? $"{bottomNode.Player.FirstName} {bottomNode.Player.LastName}" : null,
                        Seed = bottomNode.Seed,
                        IsBye = bottomNode.IsBye,
                        IsWinner = false
                    };
                }

                roundDto.Matchups.Add(matchup);
            }

            visualization.Rounds.Add(roundDto);
        }

        return visualization;
    }

    private string GetRoundName(int round, int totalRounds)
    {
        var roundsFromFinal = totalRounds - round;
        return roundsFromFinal switch
        {
            0 => "Final",
            1 => "Semi-Final",
            2 => "Quarter-Final",
            3 => "Round of 16",
            4 => "Round of 32",
            5 => "Round of 64",
            6 => "Round of 128",
            _ => $"Round {round}"
        };
    }

    public async Task<BracketNodeDto?> UpdateBracketNodeAsync(int nodeId, UpdateBracketNodeDto updateDto)
    {
        var node = await _context.Set<BracketNode>()
            .Include(n => n.Player)
            .FirstOrDefaultAsync(n => n.Id == nodeId);

        if (node == null)
            return null;

        node.PlayerId = updateDto.PlayerId;
        node.Seed = updateDto.Seed;
        node.IsBye = updateDto.IsBye;

        await _context.SaveChangesAsync();

        return _mapper.Map<BracketNodeDto>(node);
    }

    public async Task<bool> DeleteBracketAsync(int bracketId)
    {
        var bracket = await _context.Set<Domain.Entities.Bracket>()
            .Include(b => b.Nodes)
            .FirstOrDefaultAsync(b => b.Id == bracketId);

        if (bracket == null)
            return false;

        _context.Set<Domain.Entities.Bracket>().Remove(bracket);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> RegenerateBracketAsync(int bracketId)
    {
        var bracket = await _context.Set<Domain.Entities.Bracket>()
            .FirstOrDefaultAsync(b => b.Id == bracketId);

        if (bracket == null)
            return false;

        var generateDto = new GenerateBracketDto
        {
            TournamentId = bracket.TournamentId,
            BracketType = bracket.BracketType,
            DrawSize = bracket.DrawSize,
            AutoSeed = true
        };

        await GenerateBracketAsync(generateDto);
        return true;
    }

    public Task<List<int>> GetBracketSeedingOrderAsync(int drawSize)
    {
        if (!IsValidDrawSize(drawSize))
        {
            throw new ArgumentException($"Invalid draw size {drawSize}");
        }

        return Task.FromResult(GetSeedingOrder(drawSize));
    }
}