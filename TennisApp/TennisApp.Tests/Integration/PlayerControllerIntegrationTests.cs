using Xunit;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using TennisApp.Application.DTOs.Player;
using System.Linq;

namespace TennisApp.Tests.Integration;

public class PlayerControllerIntegrationTests : IntegrationTestBase
{
    private readonly JsonSerializerOptions _jsonOptions;

    public PlayerControllerIntegrationTests(SharedDatabaseFixture fixture) : base(fixture)
    {
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
    }

    [Fact]
    public async Task GetAllPlayers_ReturnsOkWithEmptyList_WhenNoPlayers()
    {
        // Act
        var response = await Client.GetAsync("/api/v1/players");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var players = JsonSerializer.Deserialize<List<PlayerDto>>(content, _jsonOptions);
        
        Assert.NotNull(players);
        Assert.Empty(players);
    }

    [Fact]
    public async Task CreatePlayer_WithValidData_ReturnsCreatedWithPlayer()
    {
        // Arrange
        var createDto = new CreatePlayerDto
        {
            FirstName = "Roger",
            LastName = "Federer",
            Country = "Switzerland",
            DateOfBirth = new DateTime(1981, 8, 8)
        };

        var content = new StringContent(
            JsonSerializer.Serialize(createDto),
            Encoding.UTF8,
            "application/json");

        // Act
        var response = await Client.PostAsync("/api/v1/players", content);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var player = JsonSerializer.Deserialize<PlayerDto>(responseContent, _jsonOptions);
        
        Assert.NotNull(player);
        Assert.Equal("Roger", player!.FirstName);
        Assert.Equal("Federer", player.LastName);
        Assert.Equal("Switzerland", player.Country);
        Assert.True(player.Id > 0);
    }

    [Fact]
    public async Task GetPlayerById_WithExistingId_ReturnsOkWithPlayer()
    {
        // Arrange - Create a player first
        var createDto = new CreatePlayerDto
        {
            FirstName = "Rafael",
            LastName = "Nadal",
            Country = "Spain",
            DateOfBirth = new DateTime(1986, 6, 3)
        };

        var createResponse = await Client.PostAsync("/api/v1/players", new StringContent(
            JsonSerializer.Serialize(createDto), Encoding.UTF8, "application/json"));

        var createdContent = await createResponse.Content.ReadAsStringAsync();
        var createdPlayer = JsonSerializer.Deserialize<PlayerDto>(createdContent, _jsonOptions);

        // Act
        var response = await Client.GetAsync($"/api/v1/players/{createdPlayer!.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var player = JsonSerializer.Deserialize<PlayerDto>(content, _jsonOptions);
        
        Assert.NotNull(player);
        Assert.Equal("Rafael", player!.FirstName);
        Assert.Equal("Nadal", player.LastName);
    }

    [Fact]
    public async Task GetPlayerById_WithNonExistentId_ReturnsNotFound()
    {
        // Act
        var response = await Client.GetAsync("/api/v1/players/99999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdatePlayer_WithValidData_ReturnsNoContent()
    {
        // Arrange - Create a player first
        var createDto = new CreatePlayerDto
        {
            FirstName = "Novak",
            LastName = "Djokovic",
            Country = "Serbia",
            DateOfBirth = new DateTime(1987, 5, 22)
        };

        var createResponse = await Client.PostAsync("/api/v1/players", new StringContent(
            JsonSerializer.Serialize(createDto), Encoding.UTF8, "application/json"));

        var createdContent = await createResponse.Content.ReadAsStringAsync();
        var createdPlayer = JsonSerializer.Deserialize<PlayerDto>(createdContent, _jsonOptions);

        // Update the player
        var updateDto = new UpdatePlayerDto
        {
            FirstName = "Novak",
            LastName = "Djokovic",
            Country = "Serbia",
            DateOfBirth = new DateTime(1987, 5, 22),
            CurrentRanking = 1,  // Changed ranking
            RankingPoints = 11000  // Changed points
        };

        var updateContent = new StringContent(
            JsonSerializer.Serialize(updateDto),
            Encoding.UTF8,
            "application/json");

        // Act
        var response = await Client.PutAsync($"/api/v1/players/{createdPlayer!.Id}", updateContent);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Verify the update
        var getResponse = await Client.GetAsync($"/api/v1/players/{createdPlayer.Id}");
        var getContent = await getResponse.Content.ReadAsStringAsync();
        var updatedPlayer = JsonSerializer.Deserialize<PlayerDto>(getContent, _jsonOptions);
        
        Assert.Equal(1, updatedPlayer!.CurrentRanking);
        Assert.Equal(11000, updatedPlayer.RankingPoints);
    }

    [Fact]
    public async Task UpdatePlayer_WithNonExistentId_ReturnsNotFound()
    {
        // Arrange
        var updateDto = new UpdatePlayerDto
        {
            FirstName = "Test",
            LastName = "Player",
            Country = "USA",
            DateOfBirth = DateTime.Now.AddYears(-25),
            CurrentRanking = 100,
            RankingPoints = 1000
        };

        var content = new StringContent(
            JsonSerializer.Serialize(updateDto),
            Encoding.UTF8,
            "application/json");

        // Act
        var response = await Client.PutAsync("/api/v1/players/99999", content);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeletePlayer_WithExistingId_ReturnsNoContent()
    {
        // Arrange - Create a player first
        var createDto = new CreatePlayerDto
        {
            FirstName = "Delete",
            LastName = "Test",
            Country = "USA",
            DateOfBirth = DateTime.Now.AddYears(-25)
        };

        var createResponse = await Client.PostAsync("/api/v1/players", new StringContent(
            JsonSerializer.Serialize(createDto), Encoding.UTF8, "application/json"));

        var createdContent = await createResponse.Content.ReadAsStringAsync();
        var createdPlayer = JsonSerializer.Deserialize<PlayerDto>(createdContent, _jsonOptions);

        // Act
        var response = await Client.DeleteAsync($"/api/v1/players/{createdPlayer!.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Verify deletion (should return NotFound due to soft delete)
        var getResponse = await Client.GetAsync($"/api/v1/players/{createdPlayer.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task DeletePlayer_WithNonExistentId_ReturnsNotFound()
    {
        // Act
        var response = await Client.DeleteAsync("/api/v1/players/99999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetAllPlayers_ReturnsAllActivePlayers_ExcludesDeleted()
    {
        // Arrange - Create multiple players
        var players = new[]
        {
            new CreatePlayerDto
            {
                FirstName = "Player1",
                LastName = "Test1",
                Country = "USA",
                DateOfBirth = DateTime.Now.AddYears(-25)
            },
            new CreatePlayerDto
            {
                FirstName = "Player2",
                LastName = "Test2",
                Country = "UK",
                DateOfBirth = DateTime.Now.AddYears(-28)
            },
            new CreatePlayerDto
            {
                FirstName = "Player3",
                LastName = "ToDelete",
                Country = "Canada",
                DateOfBirth = DateTime.Now.AddYears(-30)
            }
        };

        var createdIds = new List<int>();
        foreach (var player in players)
        {
            var response = await Client.PostAsync("/api/v1/players", new StringContent(
                JsonSerializer.Serialize(player), Encoding.UTF8, "application/json"));
            var content = await response.Content.ReadAsStringAsync();
            var created = JsonSerializer.Deserialize<PlayerDto>(content, _jsonOptions);
            createdIds.Add(created!.Id);
        }

        // Delete the third player
        await Client.DeleteAsync($"/api/v1/players/{createdIds[2]}");

        // Act
        var getAllResponse = await Client.GetAsync("/api/v1/players");

        // Assert
        Assert.Equal(HttpStatusCode.OK, getAllResponse.StatusCode);
        
        var allContent = await getAllResponse.Content.ReadAsStringAsync();
        var allPlayers = JsonSerializer.Deserialize<List<PlayerDto>>(allContent, _jsonOptions);
        
        Assert.NotNull(allPlayers);
        // Should not include the deleted player
        Assert.DoesNotContain(allPlayers, p => p.LastName == "ToDelete");
        Assert.Contains(allPlayers, p => p.LastName == "Test1");
        Assert.Contains(allPlayers, p => p.LastName == "Test2");
    }
}