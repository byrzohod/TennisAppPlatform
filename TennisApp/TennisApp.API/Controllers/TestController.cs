using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TennisApp.Application.Services.Auth;
using TennisApp.Domain.Entities;
using TennisApp.Domain.Enums;
using TennisApp.Infrastructure.Data;

namespace TennisApp.API.Controllers;

/// <summary>
/// Controller for E2E testing support. Only available in Test environment.
/// </summary>
[ApiController]
[Route("api/v{version:apiVersion}/test")]
[ApiVersion("1.0")]
public class TestController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAuthService _authService;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<TestController> _logger;

    public TestController(
        AppDbContext context, 
        IAuthService authService, 
        IWebHostEnvironment environment,
        ILogger<TestController> logger)
    {
        _context = context;
        _authService = authService;
        _environment = environment;
        _logger = logger;
    }

    /// <summary>
    /// Seeds test data for E2E tests
    /// </summary>
    [HttpPost("seed")]
    public async Task<IActionResult> SeedTestData([FromBody] SeedDataRequest? request)
    {
        if (!IsTestEnvironment())
            return Forbid("Test endpoints are only available in test environment");

        try
        {
            request ??= new SeedDataRequest();
            
            _logger.LogInformation("Seeding test data...");
            
            // Clear existing test data
            await ClearTestData();
            
            // Seed players
            var players = new List<Player>();
            for (int i = 1; i <= request.Players; i++)
            {
                var player = new Player
                {
                    FirstName = $"Test{i}",
                    LastName = $"Player{i}",
                    Email = $"player{i}@test.com",
                    Country = "USA",
                    DateOfBirth = DateTime.UtcNow.AddYears(-25),
                    Gender = i % 2 == 0 ? "F" : "M",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                players.Add(player);
            }
            await _context.Players.AddRangeAsync(players);
            
            // Seed tournaments
            var tournaments = new List<Tournament>();
            for (int i = 1; i <= request.Tournaments; i++)
            {
                var tournament = new Tournament
                {
                    Name = $"Test Tournament {i}",
                    Location = $"Test City {i}",
                    StartDate = DateTime.UtcNow.AddDays(7 * i),
                    EndDate = DateTime.UtcNow.AddDays(7 * i + 7),
                    Type = (TournamentType)(i % 5),
                    Surface = (Surface)(i % 4),
                    DrawSize = i == 1 ? 16 : 32,
                    Status = i == 1 ? TournamentStatus.Upcoming : TournamentStatus.InProgress,
                    CreatedAt = DateTime.UtcNow
                };
                tournaments.Add(tournament);
            }
            await _context.Tournaments.AddRangeAsync(tournaments);
            
            await _context.SaveChangesAsync();
            
            // Seed matches if requested
            if (request.Matches > 0 && tournaments.Any())
            {
                var matches = new List<Match>();
                var tournament = tournaments.First();
                
                for (int i = 0; i < request.Matches && i < players.Count - 1; i += 2)
                {
                    var match = new Match
                    {
                        TournamentId = tournament.Id,
                        Player1Id = players[i].Id,
                        Player2Id = players[i + 1].Id,
                        Status = MatchStatus.Scheduled,
                        ScheduledTime = DateTime.UtcNow.AddDays(1),
                        Round = "R32",
                        CreatedAt = DateTime.UtcNow
                    };
                    matches.Add(match);
                }
                await _context.Matches.AddRangeAsync(matches);
                await _context.SaveChangesAsync();
            }
            
            _logger.LogInformation("Test data seeded successfully");
            
            return Ok(new 
            { 
                message = "Test data seeded successfully",
                players = players.Count,
                tournaments = tournaments.Count,
                matches = request.Matches
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding test data");
            return StatusCode(500, new { message = "Error seeding test data", error = ex.Message });
        }
    }
    
    /// <summary>
    /// Cleans up test data
    /// </summary>
    [HttpDelete("cleanup")]
    public async Task<IActionResult> CleanupTestData()
    {
        if (!IsTestEnvironment())
            return Forbid("Test endpoints are only available in test environment");

        try
        {
            _logger.LogInformation("Cleaning up test data...");
            
            await ClearTestData();
            
            _logger.LogInformation("Test data cleaned up successfully");
            return Ok(new { message = "Test data cleaned up successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning up test data");
            return StatusCode(500, new { message = "Error cleaning up test data", error = ex.Message });
        }
    }
    
    /// <summary>
    /// Health check endpoint for E2E tests
    /// </summary>
    [HttpGet("/api/v{version:apiVersion}/health")]
    public IActionResult HealthCheck()
    {
        return Ok(new 
        { 
            status = "healthy", 
            timestamp = DateTime.UtcNow,
            environment = _environment.EnvironmentName
        });
    }
    
    private async Task ClearTestData()
    {
        // Only clear data that starts with "Test" to avoid deleting real data
        var testPlayers = await _context.Players
            .Where(p => p.FirstName.StartsWith("Test"))
            .ToListAsync();
        _context.Players.RemoveRange(testPlayers);
        
        var testTournaments = await _context.Tournaments
            .Where(t => t.Name.StartsWith("Test Tournament"))
            .ToListAsync();
        _context.Tournaments.RemoveRange(testTournaments);
        
        await _context.SaveChangesAsync();
    }
    
    private bool IsTestEnvironment()
    {
        return _environment.IsEnvironment("Test") || 
               _environment.IsDevelopment(); // Allow in development for local E2E testing
    }
}

public class SeedDataRequest
{
    public int Players { get; set; } = 20;
    public int Tournaments { get; set; } = 5;
    public int Matches { get; set; } = 10;
}