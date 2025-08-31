using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using TennisApp.Application.DTOs.Bracket;
using TennisApp.Application.Services.Bracket;
using TennisApp.Domain.Entities;
using TennisApp.Domain.Enums;
using TennisApp.Infrastructure.Data;
using Xunit;

namespace TennisApp.Tests.Unit.Services;

public class BracketServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly Mock<ILogger<BracketService>> _loggerMock;
    private readonly BracketService _bracketService;

    public BracketServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new AppDbContext(options);
        
        var config = new MapperConfiguration(cfg =>
        {
            cfg.CreateMap<Bracket, BracketDto>()
                .ForMember(dest => dest.Nodes, 
                    opt => opt.MapFrom(src => src.Nodes.OrderBy(n => n.Round).ThenBy(n => n.Position)));
            cfg.CreateMap<BracketNode, BracketNodeDto>()
                .ForMember(dest => dest.PlayerName,
                    opt => opt.MapFrom(src => src.Player != null ? $"{src.Player.FirstName} {src.Player.LastName}" : null));
        });
        _mapper = config.CreateMapper();
        
        _loggerMock = new Mock<ILogger<BracketService>>();
        _bracketService = new BracketService(_context, _mapper, _loggerMock.Object);
    }

    [Fact]
    public async Task GenerateBracketAsync_ValidInput_CreatesBracket()
    {
        // Arrange
        var tournament = new Tournament
        {
            Id = 1,
            Name = "Test Tournament",
            Location = "Test Location",
            StartDate = DateTime.UtcNow.AddDays(7),
            EndDate = DateTime.UtcNow.AddDays(14),
            Type = TournamentType.ATP250,
            Surface = Surface.HardCourt,
            DrawSize = 16,
            Status = TournamentStatus.Upcoming
        };

        var players = new List<Player>();
        for (int i = 1; i <= 8; i++)
        {
            var player = new Player
            {
                Id = i,
                FirstName = $"Player{i}",
                LastName = $"Test",
                Country = "USA",
                DateOfBirth = DateTime.UtcNow.AddYears(-25),
                Gender = "M",
                IsActive = true
            };
            players.Add(player);
        }

        _context.Tournaments.Add(tournament);
        _context.Players.AddRange(players);
        await _context.SaveChangesAsync();

        // Add tournament registrations
        foreach (var player in players)
        {
            _context.TournamentPlayers.Add(new TournamentPlayer
            {
                TournamentId = tournament.Id,
                PlayerId = player.Id,
                Status = RegistrationStatus.CheckedIn,
                RegisteredAt = DateTime.UtcNow
            });
        }
        await _context.SaveChangesAsync();

        var generateDto = new GenerateBracketDto
        {
            TournamentId = tournament.Id,
            BracketType = "Main",
            DrawSize = 16,
            AutoSeed = true
        };

        // Act
        var result = await _bracketService.GenerateBracketAsync(generateDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(16, result.DrawSize);
        Assert.Equal(4, result.TotalRounds);
        Assert.NotEmpty(result.Nodes);
        Assert.Equal(30, result.Nodes.Count); // 16 + 8 + 4 + 2 = 30 total nodes for 16-player bracket
    }

    [Fact]
    public async Task GenerateBracketAsync_InvalidDrawSize_ThrowsArgumentException()
    {
        // Arrange
        var tournament = new Tournament
        {
            Id = 1,
            Name = "Test Tournament",
            Location = "Test Location",
            StartDate = DateTime.UtcNow.AddDays(7),
            EndDate = DateTime.UtcNow.AddDays(14),
            Type = TournamentType.ATP250,
            Surface = Surface.HardCourt,
            DrawSize = 16,
            Status = TournamentStatus.Upcoming
        };

        _context.Tournaments.Add(tournament);
        await _context.SaveChangesAsync();

        var generateDto = new GenerateBracketDto
        {
            TournamentId = tournament.Id,
            BracketType = "Main",
            DrawSize = 24, // Invalid draw size
            AutoSeed = true
        };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => 
            _bracketService.GenerateBracketAsync(generateDto));
    }

    [Fact]
    public async Task GenerateBracketAsync_TooManyPlayers_ThrowsInvalidOperationException()
    {
        // Arrange
        var tournament = new Tournament
        {
            Id = 1,
            Name = "Test Tournament",
            Location = "Test Location",
            StartDate = DateTime.UtcNow.AddDays(7),
            EndDate = DateTime.UtcNow.AddDays(14),
            Type = TournamentType.ATP250,
            Surface = Surface.HardCourt,
            DrawSize = 16,
            Status = TournamentStatus.Upcoming
        };

        _context.Tournaments.Add(tournament);
        await _context.SaveChangesAsync();

        // Add more players than draw size
        for (int i = 1; i <= 20; i++)
        {
            var player = new Player
            {
                Id = i,
                FirstName = $"Player{i}",
                LastName = $"Test",
                Country = "USA",
                DateOfBirth = DateTime.UtcNow.AddYears(-25),
                Gender = "M",
                IsActive = true
            };
            _context.Players.Add(player);
            
            _context.TournamentPlayers.Add(new TournamentPlayer
            {
                TournamentId = tournament.Id,
                PlayerId = player.Id,
                Status = RegistrationStatus.CheckedIn,
                RegisteredAt = DateTime.UtcNow
            });
        }
        await _context.SaveChangesAsync();

        var generateDto = new GenerateBracketDto
        {
            TournamentId = tournament.Id,
            BracketType = "Main",
            DrawSize = 16,
            AutoSeed = true
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => 
            _bracketService.GenerateBracketAsync(generateDto));
    }

    [Fact]
    public async Task GenerateBracketAsync_WithSeeding_AssignsSeeds()
    {
        // Arrange
        var tournament = new Tournament
        {
            Id = 1,
            Name = "Test Tournament",
            Location = "Test Location",
            StartDate = DateTime.UtcNow.AddDays(7),
            EndDate = DateTime.UtcNow.AddDays(14),
            Type = TournamentType.ATP250,
            Surface = Surface.HardCourt,
            DrawSize = 16,
            Status = TournamentStatus.Upcoming
        };

        var players = new List<Player>();
        for (int i = 1; i <= 8; i++)
        {
            var player = new Player
            {
                Id = i,
                FirstName = $"Player{i}",
                LastName = $"Test",
                Country = "USA",
                DateOfBirth = DateTime.UtcNow.AddYears(-25),
                Gender = "M",
                IsActive = true
            };
            players.Add(player);
            
            // Add ranking for seeding
            var ranking = new Ranking
            {
                PlayerId = player.Id,
                Position = i * 10, // Ranking positions: 10, 20, 30, etc.
                Points = 1000 - (i * 100),
                WeekDate = DateTime.UtcNow,
                Category = RankingCategory.Singles,
                CreatedAt = DateTime.UtcNow
            };
            player.Rankings.Add(ranking);
        }

        _context.Tournaments.Add(tournament);
        _context.Players.AddRange(players);
        await _context.SaveChangesAsync();

        // Add tournament registrations
        foreach (var player in players)
        {
            _context.TournamentPlayers.Add(new TournamentPlayer
            {
                TournamentId = tournament.Id,
                PlayerId = player.Id,
                Status = RegistrationStatus.CheckedIn,
                RegisteredAt = DateTime.UtcNow
            });
        }
        await _context.SaveChangesAsync();

        var generateDto = new GenerateBracketDto
        {
            TournamentId = tournament.Id,
            BracketType = "Main",
            DrawSize = 16,
            AutoSeed = true
        };

        // Act
        var result = await _bracketService.GenerateBracketAsync(generateDto);

        // Assert
        Assert.NotNull(result);
        var firstRoundNodes = result.Nodes.Where(n => n.Round == 1).ToList();
        var seededNodes = firstRoundNodes.Where(n => n.Seed.HasValue).ToList();
        Assert.NotEmpty(seededNodes);
        
        // Check that the top seed (player with ranking 10) gets seed 1
        var topSeed = seededNodes.FirstOrDefault(n => n.Seed == 1);
        Assert.NotNull(topSeed);
        Assert.Equal(1, topSeed.PlayerId); // Player 1 has the best ranking (position 10)
    }

    [Fact]
    public async Task GetBracketAsync_ExistingBracket_ReturnsBracket()
    {
        // Arrange
        var tournament = new Tournament
        {
            Id = 1,
            Name = "Test Tournament",
            Location = "Test Location",
            StartDate = DateTime.UtcNow.AddDays(7),
            EndDate = DateTime.UtcNow.AddDays(14),
            Type = TournamentType.ATP250,
            Surface = Surface.HardCourt,
            DrawSize = 16,
            Status = TournamentStatus.Upcoming
        };

        var bracket = new Bracket
        {
            Id = 1,
            TournamentId = tournament.Id,
            BracketType = "Main",
            DrawSize = 16,
            TotalRounds = 4,
            GeneratedAt = DateTime.UtcNow,
            GeneratedBy = "System"
        };

        _context.Tournaments.Add(tournament);
        _context.Brackets.Add(bracket);
        await _context.SaveChangesAsync();

        // Act
        var result = await _bracketService.GetBracketAsync(tournament.Id, "Main");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(bracket.Id, result.Id);
        Assert.Equal(bracket.DrawSize, result.DrawSize);
    }

    [Fact]
    public async Task GetBracketAsync_NonExistingBracket_ReturnsNull()
    {
        // Act
        var result = await _bracketService.GetBracketAsync(999, "Main");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteBracketAsync_ExistingBracket_ReturnsTrue()
    {
        // Arrange
        var bracket = new Bracket
        {
            Id = 1,
            TournamentId = 1,
            BracketType = "Main",
            DrawSize = 16,
            TotalRounds = 4,
            GeneratedAt = DateTime.UtcNow,
            GeneratedBy = "System"
        };

        _context.Brackets.Add(bracket);
        await _context.SaveChangesAsync();

        // Act
        var result = await _bracketService.DeleteBracketAsync(bracket.Id);

        // Assert
        Assert.True(result);
        var deletedBracket = await _context.Brackets.FindAsync(bracket.Id);
        Assert.Null(deletedBracket);
    }

    [Fact]
    public async Task DeleteBracketAsync_NonExistingBracket_ReturnsFalse()
    {
        // Act
        var result = await _bracketService.DeleteBracketAsync(999);

        // Assert
        Assert.False(result);
    }

    [Theory]
    [InlineData(16)]
    [InlineData(32)]
    [InlineData(64)]
    [InlineData(128)]
    public async Task GetBracketSeedingOrderAsync_ValidDrawSize_ReturnsCorrectOrder(int drawSize)
    {
        // Act
        var result = await _bracketService.GetBracketSeedingOrderAsync(drawSize);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(drawSize, result.Count);
        Assert.Equal(1, result.First()); // First position should be 1
        Assert.Equal(2, result.Last()); // Last position should be 2 for proper bracket balance
    }

    [Fact]
    public async Task GetBracketSeedingOrderAsync_InvalidDrawSize_ThrowsArgumentException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => 
            _bracketService.GetBracketSeedingOrderAsync(24));
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}