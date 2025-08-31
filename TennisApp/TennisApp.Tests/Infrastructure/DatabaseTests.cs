using Xunit;
using Microsoft.EntityFrameworkCore;
using TennisApp.Infrastructure.Data;
using TennisApp.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace TennisApp.Tests.Infrastructure;

public class DatabaseTests : IDisposable
{
    private readonly AppDbContext _context;

    public DatabaseTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();
    }

    [Fact]
    public async Task Can_Add_And_Retrieve_Player()
    {
        // Arrange
        var player = new Player
        {
            FirstName = "Roger",
            LastName = "Federer",
            Country = "Switzerland",
            DateOfBirth = new DateTime(1981, 8, 8),
            CurrentRanking = 1,
            RankingPoints = 10000,
            Gender = "M",
            IsActive = true
        };

        // Act
        _context.Players.Add(player);
        await _context.SaveChangesAsync();

        // Assert
        var savedPlayer = await _context.Players.FirstOrDefaultAsync(p => p.FirstName == "Roger");
        Assert.NotNull(savedPlayer);
        Assert.Equal("Federer", savedPlayer.LastName);
        Assert.Equal("Switzerland", savedPlayer.Country);
        Assert.True(savedPlayer.Id > 0);
    }

    [Fact]
    public async Task Soft_Delete_Filters_Deleted_Records()
    {
        // Arrange
        var player = new Player
        {
            FirstName = "Test",
            LastName = "Player",
            Country = "USA",
            DateOfBirth = DateTime.Now.AddYears(-25),
            IsDeleted = false
        };

        _context.Players.Add(player);
        await _context.SaveChangesAsync();

        // Act - Mark as deleted
        player.IsDeleted = true;
        player.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Assert - Should not be found due to global filter
        var allPlayers = await _context.Players.ToListAsync();
        Assert.Empty(allPlayers);
    }

    [Fact]
    public async Task Timestamps_Are_Set_Automatically()
    {
        // Arrange
        var tournament = new Tournament
        {
            Name = "Wimbledon",
            Location = "London, UK",
            StartDate = DateTime.Now.AddDays(30),
            EndDate = DateTime.Now.AddDays(44),
            Type = Domain.Enums.TournamentType.GrandSlam,
            Surface = Domain.Enums.Surface.Grass,
            DrawSize = 128,
            PrizeMoney = 50000000,
            RankingPoints = 2000,
            Status = Domain.Enums.TournamentStatus.Upcoming
        };

        // Act
        _context.Tournaments.Add(tournament);
        await _context.SaveChangesAsync();

        // Assert
        Assert.True(tournament.CreatedAt > DateTime.MinValue);
        Assert.True(tournament.UpdatedAt > DateTime.MinValue);
        // Timestamps should be very close (within 1 second)
        var timeDifference = Math.Abs((tournament.UpdatedAt - tournament.CreatedAt).TotalSeconds);
        Assert.True(timeDifference < 1, $"CreatedAt and UpdatedAt should be within 1 second, but difference was {timeDifference} seconds");
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}