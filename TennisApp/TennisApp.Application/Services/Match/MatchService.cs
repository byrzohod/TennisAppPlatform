using AutoMapper;
using Microsoft.Extensions.Logging;
using TennisApp.Application.DTOs.Match;
using TennisApp.Domain.Enums;
using TennisApp.Domain.ValueObjects;
using TennisApp.Infrastructure.Repositories.Base;

namespace TennisApp.Application.Services.Match;

public class MatchService : IMatchService
{
    private readonly IRepository<Domain.Entities.Match> _matchRepository;
    private readonly IRepository<Domain.Entities.Player> _playerRepository;
    private readonly IRepository<Domain.Entities.Tournament> _tournamentRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<MatchService> _logger;

    public MatchService(
        IRepository<Domain.Entities.Match> matchRepository,
        IRepository<Domain.Entities.Player> playerRepository,
        IRepository<Domain.Entities.Tournament> tournamentRepository,
        IMapper mapper,
        ILogger<MatchService> logger)
    {
        _matchRepository = matchRepository;
        _playerRepository = playerRepository;
        _tournamentRepository = tournamentRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<IEnumerable<MatchDto>> GetAllMatchesAsync()
    {
        _logger.LogInformation("Getting all matches");
        var matches = await _matchRepository.FindAsync(m => !m.IsDeleted);
        
        return _mapper.Map<IEnumerable<MatchDto>>(matches);
    }

    public async Task<IEnumerable<MatchDto>> GetMatchesByTournamentAsync(int tournamentId)
    {
        _logger.LogInformation("Getting matches for tournament {TournamentId}", tournamentId);
        var matches = await _matchRepository.FindAsync(
            m => m.TournamentId == tournamentId && !m.IsDeleted);
        
        return _mapper.Map<IEnumerable<MatchDto>>(matches);
    }

    public async Task<IEnumerable<MatchDto>> GetMatchesByPlayerAsync(int playerId)
    {
        _logger.LogInformation("Getting matches for player {PlayerId}", playerId);
        var matches = await _matchRepository.FindAsync(
            m => (m.Player1Id == playerId || m.Player2Id == playerId) && !m.IsDeleted);
        
        return _mapper.Map<IEnumerable<MatchDto>>(matches);
    }

    public async Task<MatchDto?> GetMatchByIdAsync(int id)
    {
        _logger.LogInformation("Getting match {MatchId}", id);
        var match = await _matchRepository.GetByIdAsync(id);
        
        if (match == null || match.IsDeleted)
        {
            _logger.LogWarning("Match {MatchId} not found", id);
            return null;
        }
        
        return _mapper.Map<MatchDto>(match);
    }

    public async Task<MatchDto> CreateMatchAsync(CreateMatchDto createMatchDto)
    {
        _logger.LogInformation("Creating new match");
        
        // Validate tournament exists
        var tournament = await _tournamentRepository.GetByIdAsync(createMatchDto.TournamentId);
        if (tournament == null || tournament.IsDeleted)
        {
            throw new ArgumentException($"Tournament {createMatchDto.TournamentId} not found");
        }
        
        // Validate players exist
        var player1 = await _playerRepository.GetByIdAsync(createMatchDto.Player1Id);
        var player2 = await _playerRepository.GetByIdAsync(createMatchDto.Player2Id);
        
        if (player1 == null || player1.IsDeleted)
        {
            throw new ArgumentException($"Player {createMatchDto.Player1Id} not found");
        }
        
        if (player2 == null || player2.IsDeleted)
        {
            throw new ArgumentException($"Player {createMatchDto.Player2Id} not found");
        }
        
        if (createMatchDto.Player1Id == createMatchDto.Player2Id)
        {
            throw new ArgumentException("A player cannot play against themselves");
        }
        
        var match = _mapper.Map<Domain.Entities.Match>(createMatchDto);
        match.Status = MatchStatus.Scheduled;
        match.CreatedAt = DateTime.UtcNow;
        
        await _matchRepository.AddAsync(match);
        
        _logger.LogInformation("Created match {MatchId}", match.Id);
        
        return _mapper.Map<MatchDto>(match);
    }

    public async Task UpdateMatchAsync(int id, UpdateMatchDto updateMatchDto)
    {
        _logger.LogInformation("Updating match {MatchId}", id);
        
        var match = await _matchRepository.GetByIdAsync(id);
        if (match == null || match.IsDeleted)
        {
            throw new ArgumentException($"Match {id} not found");
        }
        
        // Validate winner is one of the players if specified
        if (updateMatchDto.WinnerId.HasValue)
        {
            if (updateMatchDto.WinnerId != match.Player1Id && updateMatchDto.WinnerId != match.Player2Id)
            {
                throw new ArgumentException("Winner must be one of the match players");
            }
        }
        
        _mapper.Map(updateMatchDto, match);
        match.UpdatedAt = DateTime.UtcNow;
        
        // Update score if provided
        if (!string.IsNullOrEmpty(updateMatchDto.ScoreDisplay))
        {
            match.Score = new Score { IsRetired = false, IsWalkover = false };
        }
        
        // Calculate duration if both start and end times are provided
        if (match.StartTime.HasValue && match.EndTime.HasValue)
        {
            match.Duration = (int)(match.EndTime.Value - match.StartTime.Value).TotalMinutes;
        }
        
        await _matchRepository.UpdateAsync(match);
        
        _logger.LogInformation("Updated match {MatchId}", id);
    }

    public async Task DeleteMatchAsync(int id)
    {
        _logger.LogInformation("Deleting match {MatchId}", id);
        
        var match = await _matchRepository.GetByIdAsync(id);
        if (match == null || match.IsDeleted)
        {
            throw new ArgumentException($"Match {id} not found");
        }
        
        match.IsDeleted = true;
        match.DeletedAt = DateTime.UtcNow;
        match.UpdatedAt = DateTime.UtcNow;
        
        await _matchRepository.UpdateAsync(match);
        
        _logger.LogInformation("Deleted match {MatchId}", id);
    }

    public async Task UpdateMatchScoreAsync(int id, MatchScoreDto scoreDto)
    {
        _logger.LogInformation("Updating score for match {MatchId}", id);
        
        var match = await _matchRepository.GetByIdAsync(id);
        if (match == null || match.IsDeleted)
        {
            throw new ArgumentException($"Match {id} not found");
        }
        
        var score = new Score
        {
            IsRetired = scoreDto.IsRetired,
            IsWalkover = scoreDto.IsWalkover,
            Sets = scoreDto.Sets.Select(s => new SetScore
            {
                Player1Games = s.Player1Games,
                Player2Games = s.Player2Games,
                TiebreakScore1 = s.TiebreakScore1,
                TiebreakScore2 = s.TiebreakScore2
            }).ToList()
        };
        
        match.Score = score;
        match.WinnerId = scoreDto.WinnerId;
        
        // Update match status based on score
        if (scoreDto.WinnerId.HasValue)
        {
            match.Status = scoreDto.IsWalkover ? MatchStatus.Walkover :
                          scoreDto.IsRetired ? MatchStatus.Retired :
                          MatchStatus.Completed;
        }
        
        match.UpdatedAt = DateTime.UtcNow;
        
        await _matchRepository.UpdateAsync(match);
        
        _logger.LogInformation("Updated score for match {MatchId}", id);
    }
}