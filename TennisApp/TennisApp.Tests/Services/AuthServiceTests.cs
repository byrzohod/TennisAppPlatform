using Xunit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TennisApp.Infrastructure.Data;
using TennisApp.Infrastructure.Services;
using TennisApp.Application.Services.Auth;
using TennisApp.Application.DTOs.Auth;
using TennisApp.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TennisApp.Tests.Services;

public class AuthServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly AuthService _authService;
    private readonly JwtService _jwtService;
    private readonly PasswordHasher _passwordHasher;

    public AuthServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        
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
        _passwordHasher = new PasswordHasher();
        _authService = new AuthService(_context, _jwtService, _passwordHasher);
    }

    [Fact]
    public async Task RegisterAsync_Should_Create_New_User()
    {
        var registerDto = new RegisterDto
        {
            Email = "test@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FirstName = "John",
            LastName = "Doe"
        };

        var result = await _authService.RegisterAsync(registerDto);

        Assert.NotNull(result);
        Assert.Equal("test@example.com", result.Email);
        Assert.NotEmpty(result.Token);
        
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == "test@example.com");
        Assert.NotNull(user);
        Assert.Equal("John", user.FirstName);
    }

    [Fact]
    public async Task RegisterAsync_Should_Fail_With_Existing_Email()
    {
        var existingUser = new User
        {
            Email = "existing@example.com",
            FirstName = "Existing",
            LastName = "User",
            PasswordHash = "hash",
            Role = "User"
        };
        _context.Users.Add(existingUser);
        await _context.SaveChangesAsync();

        var registerDto = new RegisterDto
        {
            Email = "existing@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            FirstName = "New",
            LastName = "User"
        };

        var result = await _authService.RegisterAsync(registerDto);

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsync_Should_Return_Token_For_Valid_Credentials()
    {
        var password = "Password123!";
        var user = new User
        {
            Email = "login@example.com",
            FirstName = "Login",
            LastName = "Test",
            PasswordHash = _passwordHasher.HashPassword(password),
            Role = "User"
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var loginDto = new LoginDto
        {
            Email = "login@example.com",
            Password = password
        };

        var result = await _authService.LoginAsync(loginDto);

        Assert.NotNull(result);
        Assert.NotEmpty(result.Token);
        Assert.Equal("login@example.com", result.Email);
    }

    [Fact]
    public async Task LoginAsync_Should_Fail_With_Invalid_Password()
    {
        var user = new User
        {
            Email = "invalid@example.com",
            FirstName = "Invalid",
            LastName = "Test",
            PasswordHash = _passwordHasher.HashPassword("CorrectPassword"),
            Role = "User"
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var loginDto = new LoginDto
        {
            Email = "invalid@example.com",
            Password = "WrongPassword"
        };

        var result = await _authService.LoginAsync(loginDto);

        Assert.Null(result);
    }

    public void Dispose()
    {
        _context?.Dispose();
    }
}