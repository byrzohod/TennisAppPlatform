using Xunit;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using TennisApp.Application.DTOs.Auth;
using System.Net.Http.Headers;

namespace TennisApp.Tests.Integration;

public class AuthControllerIntegrationTests : IntegrationTestBase
{
    private readonly JsonSerializerOptions _jsonOptions;

    public AuthControllerIntegrationTests() : base()
    {
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
    }

    [Fact]
    public async Task Register_WithValidData_ReturnsSuccessWithToken()
    {
        // Arrange
        var registerDto = new RegisterDto
        {
            Email = "newuser@test.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FirstName = "Test",
            LastName = "User"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(registerDto),
            Encoding.UTF8,
            "application/json");

        // Act
        var response = await Client.PostAsync("/api/v1/auth/register", content);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponseDto>(responseContent, _jsonOptions);
        
        Assert.NotNull(authResponse);
        Assert.NotEmpty(authResponse!.Token);
        Assert.Equal("newuser@test.com", authResponse.Email);
        Assert.Equal("Test", authResponse.FirstName);
    }

    [Fact]
    public async Task Register_WithExistingEmail_ReturnsBadRequest()
    {
        // Arrange - First register a user
        var firstUser = new RegisterDto
        {
            Email = "existing@test.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FirstName = "First",
            LastName = "User"
        };

        await Client.PostAsync("/api/v1/auth/register", new StringContent(
            JsonSerializer.Serialize(firstUser), Encoding.UTF8, "application/json"));

        // Try to register with the same email
        var duplicateUser = new RegisterDto
        {
            Email = "existing@test.com",
            Password = "Password456!",
            ConfirmPassword = "Password456!",
            FirstName = "Second",
            LastName = "User"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(duplicateUser),
            Encoding.UTF8,
            "application/json");

        // Act
        var response = await Client.PostAsync("/api/v1/auth/register", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_WithMismatchedPasswords_ReturnsBadRequest()
    {
        // Arrange
        var registerDto = new RegisterDto
        {
            Email = "mismatch@test.com",
            Password = "Password123!",
            ConfirmPassword = "DifferentPassword456!",
            FirstName = "Test",
            LastName = "User"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(registerDto),
            Encoding.UTF8,
            "application/json");

        // Act
        var response = await Client.PostAsync("/api/v1/auth/register", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsSuccessWithToken()
    {
        // Arrange - First register a user
        var registerDto = new RegisterDto
        {
            Email = "logintest@test.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FirstName = "Login",
            LastName = "Test"
        };

        await Client.PostAsync("/api/v1/auth/register", new StringContent(
            JsonSerializer.Serialize(registerDto), Encoding.UTF8, "application/json"));

        // Now try to login
        var loginDto = new LoginDto
        {
            Email = "logintest@test.com",
            Password = "Password123!"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(loginDto),
            Encoding.UTF8,
            "application/json");

        // Act
        var response = await Client.PostAsync("/api/v1/auth/login", content);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponseDto>(responseContent, _jsonOptions);
        
        Assert.NotNull(authResponse);
        Assert.NotEmpty(authResponse!.Token);
        Assert.Equal("logintest@test.com", authResponse.Email);
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ReturnsUnauthorized()
    {
        // Arrange - First register a user
        var registerDto = new RegisterDto
        {
            Email = "wrongpass@test.com",
            Password = "CorrectPassword123!",
            ConfirmPassword = "CorrectPassword123!",
            FirstName = "Wrong",
            LastName = "Pass"
        };

        await Client.PostAsync("/api/v1/auth/register", new StringContent(
            JsonSerializer.Serialize(registerDto), Encoding.UTF8, "application/json"));

        // Try to login with wrong password
        var loginDto = new LoginDto
        {
            Email = "wrongpass@test.com",
            Password = "WrongPassword456!"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(loginDto),
            Encoding.UTF8,
            "application/json");

        // Act
        var response = await Client.PostAsync("/api/v1/auth/login", content);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithNonExistentEmail_ReturnsUnauthorized()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Email = "nonexistent@test.com",
            Password = "Password123!"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(loginDto),
            Encoding.UTF8,
            "application/json");

        // Act
        var response = await Client.PostAsync("/api/v1/auth/login", content);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ValidateToken_WithValidToken_ReturnsOk()
    {
        // Arrange - Register and get a token
        var registerDto = new RegisterDto
        {
            Email = "tokentest@test.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FirstName = "Token",
            LastName = "Test"
        };

        var registerResponse = await Client.PostAsync("/api/v1/auth/register", new StringContent(
            JsonSerializer.Serialize(registerDto), Encoding.UTF8, "application/json"));

        var authContent = await registerResponse.Content.ReadAsStringAsync();
        var authResponse = JsonSerializer.Deserialize<AuthResponseDto>(authContent, _jsonOptions);

        // Add the token to the request header
        Client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", authResponse!.Token);

        // Act
        var response = await Client.PostAsync("/api/v1/auth/validate", null);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ValidateToken_WithoutToken_ReturnsUnauthorized()
    {
        // Arrange - Ensure no authorization header
        Client.DefaultRequestHeaders.Authorization = null;

        // Act
        var response = await Client.PostAsync("/api/v1/auth/validate", null);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ValidateToken_WithInvalidToken_ReturnsUnauthorized()
    {
        // Arrange
        Client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", "invalid.token.here");

        // Act
        var response = await Client.PostAsync("/api/v1/auth/validate", null);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}