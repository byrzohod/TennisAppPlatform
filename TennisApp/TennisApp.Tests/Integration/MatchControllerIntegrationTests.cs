using Xunit;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using TennisApp.Application.DTOs.Match;
using TennisApp.Application.DTOs.Player;
using TennisApp.Application.DTOs.Tournament;
using TennisApp.Domain.Enums;
using System.Linq;
using System.Net.Http.Headers;
using TennisApp.Application.DTOs.Auth;

namespace TennisApp.Tests.Integration;

public class MatchControllerIntegrationTests : IntegrationTestBase
{
    private readonly JsonSerializerOptions _jsonOptions;

    public MatchControllerIntegrationTests(SharedDatabaseFixture fixture) : base(fixture)
    {
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
    }

    private async Task<string> GetAuthTokenAsync()
    {
        var registerDto = new RegisterDto
        {
            Email = $"test{Guid.NewGuid()}@example.com",
            Password = "Test123!@#",
            ConfirmPassword = "Test123!@#",
            FirstName = "Test",
            LastName = "User"
        };

        var registerContent = new StringContent(
            JsonSerializer.Serialize(registerDto),
            Encoding.UTF8,
            "application/json");

        await Client.PostAsync("/api/v1/auth/register", registerContent);

        var loginDto = new LoginDto
        {
            Email = registerDto.Email,
            Password = registerDto.Password
        };

        var loginContent = new StringContent(
            JsonSerializer.Serialize(loginDto),
            Encoding.UTF8,
            "application/json");

        var loginResponse = await Client.PostAsync("/api/v1/auth/login", loginContent);
        var loginResponseContent = await loginResponse.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponseDto>(loginResponseContent, _jsonOptions);

        return authResponse!.Token;
    }

    private async Task<(int tournamentId, int player1Id, int player2Id)> CreateTestDataAsync()
    {
        // Create tournament
        var tournamentDto = new CreateTournamentDto
        {
            Name = "Test Tournament",
            Location = "Test Location",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(7),
            Type = TournamentType.ITF,
            Surface = Surface.HardCourt,
            DrawSize = 32,
            PrizeMoney = 10000,
            RankingPoints = 100
        };

        var tournamentContent = new StringContent(
            JsonSerializer.Serialize(tournamentDto),
            Encoding.UTF8,
            "application/json");

        var tournamentResponse = await Client.PostAsync("/api/v1/tournaments", tournamentContent);
        var tournamentResponseContent = await tournamentResponse.Content.ReadAsStringAsync();
        var tournament = JsonSerializer.Deserialize<TournamentDto>(tournamentResponseContent, _jsonOptions);

        // Create player 1
        var player1Dto = new CreatePlayerDto
        {
            FirstName = "John",
            LastName = "Doe",
            Country = "USA",
            DateOfBirth = new DateTime(1990, 1, 1)
        };

        var player1Content = new StringContent(
            JsonSerializer.Serialize(player1Dto),
            Encoding.UTF8,
            "application/json");

        var player1Response = await Client.PostAsync("/api/v1/players", player1Content);
        var player1ResponseContent = await player1Response.Content.ReadAsStringAsync();
        var player1 = JsonSerializer.Deserialize<PlayerDto>(player1ResponseContent, _jsonOptions);

        // Create player 2
        var player2Dto = new CreatePlayerDto
        {
            FirstName = "Jane",
            LastName = "Smith",
            Country = "UK",
            DateOfBirth = new DateTime(1992, 5, 15)
        };

        var player2Content = new StringContent(
            JsonSerializer.Serialize(player2Dto),
            Encoding.UTF8,
            "application/json");

        var player2Response = await Client.PostAsync("/api/v1/players", player2Content);
        var player2ResponseContent = await player2Response.Content.ReadAsStringAsync();
        var player2 = JsonSerializer.Deserialize<PlayerDto>(player2ResponseContent, _jsonOptions);

        return (tournament!.Id, player1!.Id, player2!.Id);
    }

    [Fact]
    public async Task GetAllMatches_ReturnsOkWithEmptyList_WhenNoMatches()
    {
        // Act
        var response = await Client.GetAsync("/api/v1/matches");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var matches = JsonSerializer.Deserialize<List<MatchDto>>(content, _jsonOptions);
        
        Assert.NotNull(matches);
        Assert.Empty(matches);
    }

    [Fact]
    public async Task CreateMatch_WithValidData_ReturnsCreatedWithMatch()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var (tournamentId, player1Id, player2Id) = await CreateTestDataAsync();

        var createDto = new CreateMatchDto
        {
            TournamentId = tournamentId,
            Player1Id = player1Id,
            Player2Id = player2Id,
            Round = "Quarter Final",
            ScheduledTime = DateTime.UtcNow.AddDays(2),
            Court = "Center Court"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(createDto),
            Encoding.UTF8,
            "application/json");

        // Act
        var response = await Client.PostAsync("/api/v1/matches", content);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var match = JsonSerializer.Deserialize<MatchDto>(responseContent, _jsonOptions);
        
        Assert.NotNull(match);
        Assert.Equal(tournamentId, match!.TournamentId);
        Assert.Equal(player1Id, match.Player1Id);
        Assert.Equal(player2Id, match.Player2Id);
        Assert.Equal("Quarter Final", match.Round);
        Assert.Equal("Center Court", match.Court);
        Assert.Equal(MatchStatus.Scheduled, match.Status);
        Assert.True(match.Id > 0);
    }

    [Fact]
    public async Task CreateMatch_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var (tournamentId, player1Id, player2Id) = await CreateTestDataAsync();

        var createDto = new CreateMatchDto
        {
            TournamentId = tournamentId,
            Player1Id = player1Id,
            Player2Id = player2Id,
            Round = "Quarter Final"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(createDto),
            Encoding.UTF8,
            "application/json");

        // Act
        var response = await Client.PostAsync("/api/v1/matches", content);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetMatchById_WithExistingId_ReturnsOkWithMatch()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var (tournamentId, player1Id, player2Id) = await CreateTestDataAsync();

        var createDto = new CreateMatchDto
        {
            TournamentId = tournamentId,
            Player1Id = player1Id,
            Player2Id = player2Id,
            Round = "Semi Final"
        };

        var createResponse = await Client.PostAsync("/api/v1/matches", new StringContent(
            JsonSerializer.Serialize(createDto), Encoding.UTF8, "application/json"));

        var createdContent = await createResponse.Content.ReadAsStringAsync();
        var createdMatch = JsonSerializer.Deserialize<MatchDto>(createdContent, _jsonOptions);

        // Act
        var response = await Client.GetAsync($"/api/v1/matches/{createdMatch!.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var match = JsonSerializer.Deserialize<MatchDto>(content, _jsonOptions);
        
        Assert.NotNull(match);
        Assert.Equal(createdMatch.Id, match!.Id);
        Assert.Equal("Semi Final", match.Round);
    }

    [Fact]
    public async Task GetMatchById_WithNonExistentId_ReturnsNotFound()
    {
        // Act
        var response = await Client.GetAsync("/api/v1/matches/99999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateMatch_WithValidData_ReturnsNoContent()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var (tournamentId, player1Id, player2Id) = await CreateTestDataAsync();

        var createDto = new CreateMatchDto
        {
            TournamentId = tournamentId,
            Player1Id = player1Id,
            Player2Id = player2Id,
            Round = "Final"
        };

        var createResponse = await Client.PostAsync("/api/v1/matches", new StringContent(
            JsonSerializer.Serialize(createDto), Encoding.UTF8, "application/json"));

        var createdContent = await createResponse.Content.ReadAsStringAsync();
        var createdMatch = JsonSerializer.Deserialize<MatchDto>(createdContent, _jsonOptions);

        // Update the match
        var updateDto = new UpdateMatchDto
        {
            WinnerId = player1Id,
            StartTime = DateTime.UtcNow,
            EndTime = DateTime.UtcNow.AddHours(2),
            Status = MatchStatus.Completed,
            ScoreDisplay = "6-4 6-3",
            Duration = 120
        };

        var updateContent = new StringContent(
            JsonSerializer.Serialize(updateDto),
            Encoding.UTF8,
            "application/json");

        // Act
        var response = await Client.PutAsync($"/api/v1/matches/{createdMatch!.Id}", updateContent);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Verify the update
        var getResponse = await Client.GetAsync($"/api/v1/matches/{createdMatch.Id}");
        var getContent = await getResponse.Content.ReadAsStringAsync();
        var updatedMatch = JsonSerializer.Deserialize<MatchDto>(getContent, _jsonOptions);
        
        Assert.Equal(player1Id, updatedMatch!.WinnerId);
        Assert.Equal(MatchStatus.Completed, updatedMatch.Status);
        Assert.Equal(120, updatedMatch.Duration);
    }

    [Fact]
    public async Task DeleteMatch_WithExistingId_ReturnsNoContent()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var (tournamentId, player1Id, player2Id) = await CreateTestDataAsync();

        var createDto = new CreateMatchDto
        {
            TournamentId = tournamentId,
            Player1Id = player1Id,
            Player2Id = player2Id,
            Round = "Round 1"
        };

        var createResponse = await Client.PostAsync("/api/v1/matches", new StringContent(
            JsonSerializer.Serialize(createDto), Encoding.UTF8, "application/json"));

        var createdContent = await createResponse.Content.ReadAsStringAsync();
        var createdMatch = JsonSerializer.Deserialize<MatchDto>(createdContent, _jsonOptions);

        // Act
        var response = await Client.DeleteAsync($"/api/v1/matches/{createdMatch!.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Verify deletion
        var getResponse = await Client.GetAsync($"/api/v1/matches/{createdMatch.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task GetMatchesByTournament_ReturnsMatchesForTournament()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var (tournamentId, player1Id, player2Id) = await CreateTestDataAsync();

        // Create multiple matches for the tournament
        for (int i = 0; i < 3; i++)
        {
            var createDto = new CreateMatchDto
            {
                TournamentId = tournamentId,
                Player1Id = player1Id,
                Player2Id = player2Id,
                Round = $"Round {i + 1}"
            };

            await Client.PostAsync("/api/v1/matches", new StringContent(
                JsonSerializer.Serialize(createDto), Encoding.UTF8, "application/json"));
        }

        // Act
        var response = await Client.GetAsync($"/api/v1/matches/tournament/{tournamentId}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var matches = JsonSerializer.Deserialize<List<MatchDto>>(content, _jsonOptions);
        
        Assert.NotNull(matches);
        Assert.Equal(3, matches!.Count);
        Assert.All(matches, m => Assert.Equal(tournamentId, m.TournamentId));
    }

    [Fact]
    public async Task GetMatchesByPlayer_ReturnsMatchesForPlayer()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var (tournamentId, player1Id, player2Id) = await CreateTestDataAsync();

        // Create matches for player1
        for (int i = 0; i < 2; i++)
        {
            var createDto = new CreateMatchDto
            {
                TournamentId = tournamentId,
                Player1Id = player1Id,
                Player2Id = player2Id,
                Round = $"Match {i + 1}"
            };

            await Client.PostAsync("/api/v1/matches", new StringContent(
                JsonSerializer.Serialize(createDto), Encoding.UTF8, "application/json"));
        }

        // Act
        var response = await Client.GetAsync($"/api/v1/matches/player/{player1Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var matches = JsonSerializer.Deserialize<List<MatchDto>>(content, _jsonOptions);
        
        Assert.NotNull(matches);
        Assert.Equal(2, matches!.Count);
        Assert.All(matches, m => Assert.True(m.Player1Id == player1Id || m.Player2Id == player1Id));
    }
}