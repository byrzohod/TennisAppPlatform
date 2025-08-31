using Xunit;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using TennisApp.Application.DTOs.Tournament;
using TennisApp.Application.DTOs.Player;
using TennisApp.Application.DTOs.Auth;
using TennisApp.Domain.Enums;
using System.Linq;
using System.Net.Http.Headers;

namespace TennisApp.Tests.Integration;

public class TournamentRegistrationIntegrationTests : IntegrationTestBase
{
    private readonly JsonSerializerOptions _jsonOptions;

    public TournamentRegistrationIntegrationTests() : base()
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
            Name = "Test Registration Tournament",
            Location = "Test Location",
            StartDate = DateTime.UtcNow.AddDays(7),
            EndDate = DateTime.UtcNow.AddDays(14),
            Type = TournamentType.ATP250,
            Surface = Surface.HardCourt,
            DrawSize = 32,
            PrizeMoney = 50000,
            RankingPoints = 250
        };

        var tournamentContent = new StringContent(
            JsonSerializer.Serialize(tournamentDto),
            Encoding.UTF8,
            "application/json");

        var tournamentResponse = await Client.PostAsync("/api/v1/tournaments", tournamentContent);
        var tournamentResponseContent = await tournamentResponse.Content.ReadAsStringAsync();
        var tournament = JsonSerializer.Deserialize<TournamentDto>(tournamentResponseContent, _jsonOptions);

        // Create players
        var player1Dto = new CreatePlayerDto
        {
            FirstName = "Alice",
            LastName = "Johnson",
            Country = "USA",
            DateOfBirth = new DateTime(1995, 3, 15)
        };

        var player1Content = new StringContent(
            JsonSerializer.Serialize(player1Dto),
            Encoding.UTF8,
            "application/json");

        var player1Response = await Client.PostAsync("/api/v1/players", player1Content);
        var player1ResponseContent = await player1Response.Content.ReadAsStringAsync();
        var player1 = JsonSerializer.Deserialize<PlayerDto>(player1ResponseContent, _jsonOptions);

        var player2Dto = new CreatePlayerDto
        {
            FirstName = "Bob",
            LastName = "Smith",
            Country = "Canada",
            DateOfBirth = new DateTime(1993, 7, 20)
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
    public async Task GetTournamentRegistrations_ReturnsEmptyList_WhenNoRegistrations()
    {
        // Arrange
        var (tournamentId, _, _) = await CreateTestDataAsync();

        // Act
        var response = await Client.GetAsync($"/api/v1/tournaments/{tournamentId}/registrations");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var registrations = JsonSerializer.Deserialize<List<TournamentRegistrationDto>>(content, _jsonOptions);
        
        Assert.NotNull(registrations);
        Assert.Empty(registrations);
    }

    [Fact]
    public async Task RegisterPlayer_WithValidData_ReturnsCreatedRegistration()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var (tournamentId, playerId, _) = await CreateTestDataAsync();

        var registerDto = new RegisterPlayerDto
        {
            PlayerId = playerId,
            IsWildcard = false,
            IsQualifier = false,
            Notes = "Test registration"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(registerDto),
            Encoding.UTF8,
            "application/json");

        // Act
        var response = await Client.PostAsync($"/api/v1/tournaments/{tournamentId}/registrations", content);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var registration = JsonSerializer.Deserialize<TournamentRegistrationDto>(responseContent, _jsonOptions);
        
        Assert.NotNull(registration);
        Assert.Equal(tournamentId, registration!.TournamentId);
        Assert.Equal(playerId, registration.PlayerId);
        Assert.Equal(RegistrationStatus.Pending, registration.Status);
        Assert.False(registration.IsWildcard);
        Assert.Equal("Test registration", registration.Notes);
    }

    [Fact]
    public async Task RegisterPlayer_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var (tournamentId, playerId, _) = await CreateTestDataAsync();

        var registerDto = new RegisterPlayerDto
        {
            PlayerId = playerId
        };

        var content = new StringContent(
            JsonSerializer.Serialize(registerDto),
            Encoding.UTF8,
            "application/json");

        // Act
        var response = await Client.PostAsync($"/api/v1/tournaments/{tournamentId}/registrations", content);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task RegisterPlayer_DuplicateRegistration_ReturnsConflict()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var (tournamentId, playerId, _) = await CreateTestDataAsync();

        var registerDto = new RegisterPlayerDto
        {
            PlayerId = playerId
        };

        var content = new StringContent(
            JsonSerializer.Serialize(registerDto),
            Encoding.UTF8,
            "application/json");

        // Register once
        await Client.PostAsync($"/api/v1/tournaments/{tournamentId}/registrations", content);

        // Act - Try to register again
        var response = await Client.PostAsync($"/api/v1/tournaments/{tournamentId}/registrations", content);

        // Assert
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task GetRegistration_WithExistingRegistration_ReturnsRegistration()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var (tournamentId, playerId, _) = await CreateTestDataAsync();

        var registerDto = new RegisterPlayerDto
        {
            PlayerId = playerId,
            IsWildcard = true
        };

        await Client.PostAsync($"/api/v1/tournaments/{tournamentId}/registrations", 
            new StringContent(JsonSerializer.Serialize(registerDto), Encoding.UTF8, "application/json"));

        // Act
        var response = await Client.GetAsync($"/api/v1/tournaments/{tournamentId}/registrations/{playerId}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var registration = JsonSerializer.Deserialize<TournamentRegistrationDto>(content, _jsonOptions);
        
        Assert.NotNull(registration);
        Assert.Equal(playerId, registration!.PlayerId);
        Assert.True(registration.IsWildcard);
    }

    [Fact]
    public async Task UpdateRegistration_WithValidData_ReturnsNoContent()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var (tournamentId, playerId, _) = await CreateTestDataAsync();

        // Register player first
        var registerDto = new RegisterPlayerDto { PlayerId = playerId };
        await Client.PostAsync($"/api/v1/tournaments/{tournamentId}/registrations",
            new StringContent(JsonSerializer.Serialize(registerDto), Encoding.UTF8, "application/json"));

        // Update registration
        var updateDto = new UpdateRegistrationDto
        {
            Seed = 5,
            Status = RegistrationStatus.Approved,
            Notes = "Approved for main draw"
        };

        var updateContent = new StringContent(
            JsonSerializer.Serialize(updateDto),
            Encoding.UTF8,
            "application/json");

        // Act
        var response = await Client.PutAsync(
            $"/api/v1/tournaments/{tournamentId}/registrations/{playerId}", updateContent);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Verify the update
        var getResponse = await Client.GetAsync($"/api/v1/tournaments/{tournamentId}/registrations/{playerId}");
        var getContent = await getResponse.Content.ReadAsStringAsync();
        var updated = JsonSerializer.Deserialize<TournamentRegistrationDto>(getContent, _jsonOptions);
        
        Assert.Equal(5, updated!.Seed);
        Assert.Equal(RegistrationStatus.Approved, updated.Status);
        Assert.Equal("Approved for main draw", updated.Notes);
    }

    [Fact]
    public async Task CheckInPlayer_WithApprovedRegistration_ReturnsNoContent()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var (tournamentId, playerId, _) = await CreateTestDataAsync();

        // Register and approve player
        var registerDto = new RegisterPlayerDto { PlayerId = playerId };
        await Client.PostAsync($"/api/v1/tournaments/{tournamentId}/registrations",
            new StringContent(JsonSerializer.Serialize(registerDto), Encoding.UTF8, "application/json"));

        var updateDto = new UpdateRegistrationDto { Status = RegistrationStatus.Approved };
        await Client.PutAsync($"/api/v1/tournaments/{tournamentId}/registrations/{playerId}",
            new StringContent(JsonSerializer.Serialize(updateDto), Encoding.UTF8, "application/json"));

        // Act
        var response = await Client.PostAsync(
            $"/api/v1/tournaments/{tournamentId}/registrations/{playerId}/checkin", null);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Verify check-in
        var getResponse = await Client.GetAsync($"/api/v1/tournaments/{tournamentId}/registrations/{playerId}");
        var getContent = await getResponse.Content.ReadAsStringAsync();
        var registration = JsonSerializer.Deserialize<TournamentRegistrationDto>(getContent, _jsonOptions);
        
        Assert.Equal(RegistrationStatus.CheckedIn, registration!.Status);
        Assert.NotNull(registration.CheckedInAt);
    }

    [Fact]
    public async Task WithdrawPlayer_WithExistingRegistration_ReturnsNoContent()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var (tournamentId, playerId, _) = await CreateTestDataAsync();

        // Register player
        var registerDto = new RegisterPlayerDto { PlayerId = playerId };
        await Client.PostAsync($"/api/v1/tournaments/{tournamentId}/registrations",
            new StringContent(JsonSerializer.Serialize(registerDto), Encoding.UTF8, "application/json"));

        // Act
        var response = await Client.PostAsync(
            $"/api/v1/tournaments/{tournamentId}/registrations/{playerId}/withdraw", null);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Verify withdrawal
        var getResponse = await Client.GetAsync($"/api/v1/tournaments/{tournamentId}/registrations/{playerId}");
        var getContent = await getResponse.Content.ReadAsStringAsync();
        var registration = JsonSerializer.Deserialize<TournamentRegistrationDto>(getContent, _jsonOptions);
        
        Assert.Equal(RegistrationStatus.Withdrawn, registration!.Status);
    }

    [Fact]
    public async Task BulkRegisterPlayers_WithValidData_ReturnsRegistrations()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var (tournamentId, player1Id, player2Id) = await CreateTestDataAsync();

        var bulkDto = new BulkRegistrationDto
        {
            PlayerIds = new List<int> { player1Id, player2Id },
            IsWildcard = false,
            IsQualifier = true
        };

        var content = new StringContent(
            JsonSerializer.Serialize(bulkDto),
            Encoding.UTF8,
            "application/json");

        // Act
        var response = await Client.PostAsync(
            $"/api/v1/tournaments/{tournamentId}/registrations/bulk", content);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var registrations = JsonSerializer.Deserialize<List<TournamentRegistrationDto>>(responseContent, _jsonOptions);
        
        Assert.NotNull(registrations);
        Assert.Equal(2, registrations!.Count);
        Assert.All(registrations, r => Assert.True(r.IsQualifier));
        Assert.All(registrations, r => Assert.False(r.IsWildcard));
    }
}