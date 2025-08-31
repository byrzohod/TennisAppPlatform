using Xunit;
using Microsoft.Extensions.Configuration;
using TennisApp.Infrastructure.Services;
using TennisApp.Domain.Entities;
using System.Collections.Generic;

namespace TennisApp.Tests.Services;

public class JwtServiceTests
{
    private readonly JwtService _jwtService;

    public JwtServiceTests()
    {
        var inMemorySettings = new Dictionary<string, string>
        {
            {"Jwt:SecretKey", "TestSecretKeyThatIsLongEnoughForHmacSha256Algorithm"},
            {"Jwt:Issuer", "TestIssuer"},
            {"Jwt:Audience", "TestAudience"},
            {"Jwt:ExpirationMinutes", "60"}
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings!)
            .Build();

        _jwtService = new JwtService(configuration);
    }

    [Fact]
    public void GenerateToken_Should_Create_Valid_Token()
    {
        var user = new User
        {
            Id = "1",
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            Role = "User"
        };

        var token = _jwtService.GenerateToken(user);

        Assert.NotNull(token);
        Assert.NotEmpty(token);
        Assert.Contains(".", token);
    }

    [Fact]
    public void ValidateToken_Should_Return_True_For_Valid_Token()
    {
        var user = new User
        {
            Id = "1",
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            Role = "User"
        };

        var token = _jwtService.GenerateToken(user);
        var isValid = _jwtService.ValidateToken(token);

        Assert.True(isValid);
    }

    [Fact]
    public void ValidateToken_Should_Return_False_For_Invalid_Token()
    {
        var invalidToken = "invalid.token.here";
        var isValid = _jwtService.ValidateToken(invalidToken);

        Assert.False(isValid);
    }
}