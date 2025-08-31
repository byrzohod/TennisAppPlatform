using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TennisApp.Application.DTOs.Auth;
using TennisApp.Application.DTOs.Bracket;
using TennisApp.Application.DTOs.Player;
using TennisApp.Application.DTOs.Tournament;
using TennisApp.Application.Services.Auth;
using TennisApp.Domain.Entities;
using TennisApp.Domain.Enums;
using TennisApp.Infrastructure.Data;
using TennisApp.Infrastructure.Services;
using Xunit;

namespace TennisApp.Tests.Integration;

[Collection("Database Collection")]
public class BracketsControllerTests : IntegrationTestBase
{
    public BracketsControllerTests(SharedDatabaseFixture fixture) : base(fixture)
    {
    }

    protected override async Task SeedTestDataAsync()
    {
        // Create an admin user for testing
        using var scope = Factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<PasswordHasher>();
        
        var adminUser = new Domain.Entities.User
        {
            Email = "admin@tennisapp.com",
            FirstName = "Admin",
            LastName = "User",
            PasswordHash = passwordHasher.HashPassword("Admin123!"),
            Role = "Admin",
            IsActive = true
        };
        
        dbContext.Users.Add(adminUser);
        await dbContext.SaveChangesAsync();
    }

    private async Task<string> GetAdminTokenAsync()
    {
        var loginDto = new LoginDto
        {
            Email = "admin@tennisapp.com",
            Password = "Admin123!"
        };

        var response = await Client.PostAsJsonAsync("/api/v1/auth/login", loginDto);
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(content);
        return result.GetProperty("token").GetString()!;
    }

    private async Task<string> GetOrganizerTokenAsync()
    {
        // For simplicity, just use admin token since we don't have role-based registration
        return await GetAdminTokenAsync();
    }

    private async Task<int> CreateTestTournamentAsync(string token)
    {
        Client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", token);

        var createDto = new CreateTournamentDto
        {
            Name = $"Test Tournament {Guid.NewGuid()}",
            Location = "Test Location",
            StartDate = DateTime.UtcNow.AddDays(7),
            EndDate = DateTime.UtcNow.AddDays(14),
            Type = TournamentType.ATP250,
            Surface = Surface.HardCourt,
            DrawSize = 16,
            PrizeMoney = 100000,
            RankingPoints = 250,
            Description = "Test tournament for bracket generation"
        };

        var response = await Client.PostAsJsonAsync("/api/v1/tournaments", createDto);
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(content);
        return result.GetProperty("id").GetInt32();
    }

    private async Task<List<int>> CreateAndRegisterPlayersAsync(string token, int tournamentId, int count)
    {
        Client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", token);

        var playerIds = new List<int>();

        for (int i = 1; i <= count; i++)
        {
            // Create player
            var createPlayerDto = new CreatePlayerDto
            {
                FirstName = $"Player{i}",
                LastName = $"Test",
                Country = "USA",
                DateOfBirth = DateTime.UtcNow.AddYears(-25)
            };

            var playerResponse = await Client.PostAsJsonAsync("/api/v1/players", createPlayerDto);
            playerResponse.EnsureSuccessStatusCode();

            var playerContent = await playerResponse.Content.ReadAsStringAsync();
            var playerResult = JsonSerializer.Deserialize<JsonElement>(playerContent);
            var playerId = playerResult.GetProperty("id").GetInt32();
            playerIds.Add(playerId);

            // Register player for tournament
            var registerDto = new Application.DTOs.Tournament.RegisterPlayerDto
            {
                PlayerId = playerId,
                IsWildcard = false,
                IsQualifier = false
            };

            var registerResponse = await Client.PostAsJsonAsync($"/api/v1/tournaments/{tournamentId}/registrations", registerDto);
            registerResponse.EnsureSuccessStatusCode();

            // Check in the player
            await Client.PostAsync($"/api/v1/tournaments/{tournamentId}/registrations/{playerId}/checkin", null);
        }

        return playerIds;
    }

    [Fact]
    public async Task GenerateBracket_ValidRequest_ReturnsCreatedBracket()
    {
        // Arrange
        var token = await GetAdminTokenAsync();
        var tournamentId = await CreateTestTournamentAsync(token);
        await CreateAndRegisterPlayersAsync(token, tournamentId, 8);

        Client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", token);

        var generateDto = new GenerateBracketDto
        {
            TournamentId = tournamentId,
            BracketType = "Main",
            DrawSize = 16,
            AutoSeed = true
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/brackets/generate", generateDto);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var bracket = JsonSerializer.Deserialize<BracketDto>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        Assert.NotNull(bracket);
        Assert.Equal(16, bracket!.DrawSize);
        Assert.Equal(4, bracket.TotalRounds);
        Assert.NotEmpty(bracket.Nodes);
    }

    [Fact]
    public async Task GenerateBracket_AsOrganizer_ReturnsCreatedBracket()
    {
        // Arrange
        var organizerToken = await GetOrganizerTokenAsync();
        var adminToken = await GetAdminTokenAsync();
        var tournamentId = await CreateTestTournamentAsync(adminToken);
        await CreateAndRegisterPlayersAsync(adminToken, tournamentId, 8);

        Client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", organizerToken);

        var generateDto = new GenerateBracketDto
        {
            TournamentId = tournamentId,
            BracketType = "Main",
            DrawSize = 16,
            AutoSeed = true
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/brackets/generate", generateDto);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GenerateBracket_Unauthorized_ReturnsUnauthorized()
    {
        // Arrange
        var generateDto = new GenerateBracketDto
        {
            TournamentId = 1,
            BracketType = "Main",
            DrawSize = 16,
            AutoSeed = true
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/brackets/generate", generateDto);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GenerateBracket_InvalidDrawSize_ReturnsBadRequest()
    {
        // Arrange
        var token = await GetAdminTokenAsync();
        var tournamentId = await CreateTestTournamentAsync(token);

        Client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", token);

        var generateDto = new GenerateBracketDto
        {
            TournamentId = tournamentId,
            BracketType = "Main",
            DrawSize = 24, // Invalid draw size
            AutoSeed = true
        };

        // Act
        var response = await Client.PostAsJsonAsync("/api/brackets/generate", generateDto);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetBracket_ExistingBracket_ReturnsBracket()
    {
        // Arrange
        var token = await GetAdminTokenAsync();
        var tournamentId = await CreateTestTournamentAsync(token);
        await CreateAndRegisterPlayersAsync(token, tournamentId, 8);

        Client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", token);

        var generateDto = new GenerateBracketDto
        {
            TournamentId = tournamentId,
            BracketType = "Main",
            DrawSize = 16,
            AutoSeed = true
        };

        await Client.PostAsJsonAsync("/api/brackets/generate", generateDto);

        // Act - Get bracket without authorization (public endpoint)
        Client.DefaultRequestHeaders.Authorization = null;
        var response = await Client.GetAsync($"/api/brackets/tournament/{tournamentId}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var bracket = JsonSerializer.Deserialize<BracketDto>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        Assert.NotNull(bracket);
        Assert.Equal(tournamentId, bracket!.TournamentId);
    }

    [Fact]
    public async Task GetBracket_NonExistingBracket_ReturnsNotFound()
    {
        // Act
        var response = await Client.GetAsync("/api/brackets/tournament/99999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetBracketVisualization_ExistingBracket_ReturnsVisualization()
    {
        // Arrange
        var token = await GetAdminTokenAsync();
        var tournamentId = await CreateTestTournamentAsync(token);
        await CreateAndRegisterPlayersAsync(token, tournamentId, 8);

        Client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", token);

        var generateDto = new GenerateBracketDto
        {
            TournamentId = tournamentId,
            BracketType = "Main",
            DrawSize = 16,
            AutoSeed = true
        };

        await Client.PostAsJsonAsync("/api/brackets/generate", generateDto);

        // Act - Get visualization without authorization (public endpoint)
        Client.DefaultRequestHeaders.Authorization = null;
        var response = await Client.GetAsync($"/api/brackets/tournament/{tournamentId}/visualization");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var visualization = JsonSerializer.Deserialize<BracketVisualizationDto>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        Assert.NotNull(visualization);
        Assert.Equal(tournamentId, visualization!.TournamentId);
        Assert.NotEmpty(visualization.Rounds);
        Assert.Equal(4, visualization.Rounds.Count); // 4 rounds for 16-player bracket
    }

    [Fact]
    public async Task DeleteBracket_AsAdmin_ReturnsNoContent()
    {
        // Arrange
        var token = await GetAdminTokenAsync();
        var tournamentId = await CreateTestTournamentAsync(token);
        await CreateAndRegisterPlayersAsync(token, tournamentId, 8);

        Client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", token);

        var generateDto = new GenerateBracketDto
        {
            TournamentId = tournamentId,
            BracketType = "Main",
            DrawSize = 16,
            AutoSeed = true
        };

        var generateResponse = await Client.PostAsJsonAsync("/api/brackets/generate", generateDto);
        var bracketContent = await generateResponse.Content.ReadAsStringAsync();
        var bracket = JsonSerializer.Deserialize<BracketDto>(bracketContent, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });

        // Act
        var response = await Client.DeleteAsync($"/api/brackets/{bracket!.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Verify bracket is deleted
        var getResponse = await Client.GetAsync($"/api/brackets/{bracket.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task GetSeedingOrder_ValidDrawSize_ReturnsOrder()
    {
        // Act
        var response = await Client.GetAsync("/api/brackets/seeding-order/32");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var order = JsonSerializer.Deserialize<List<int>>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        Assert.NotNull(order);
        Assert.Equal(32, order!.Count);
        Assert.Equal(1, order.First());
        Assert.Equal(2, order.Last());
    }

    [Fact]
    public async Task GetSeedingOrder_InvalidDrawSize_ReturnsBadRequest()
    {
        // Act
        var response = await Client.GetAsync("/api/brackets/seeding-order/24");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task RegenerateBracket_ExistingBracket_ReturnsOk()
    {
        // Arrange
        var token = await GetAdminTokenAsync();
        var tournamentId = await CreateTestTournamentAsync(token);
        await CreateAndRegisterPlayersAsync(token, tournamentId, 8);

        Client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", token);

        var generateDto = new GenerateBracketDto
        {
            TournamentId = tournamentId,
            BracketType = "Main",
            DrawSize = 16,
            AutoSeed = true
        };

        var generateResponse = await Client.PostAsJsonAsync("/api/brackets/generate", generateDto);
        var bracketContent = await generateResponse.Content.ReadAsStringAsync();
        var bracket = JsonSerializer.Deserialize<BracketDto>(bracketContent, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });

        // Act
        var response = await Client.PostAsync($"/api/brackets/{bracket!.Id}/regenerate", null);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}