using Microsoft.EntityFrameworkCore;
using TennisApp.Application.DTOs.Auth;
using TennisApp.Domain.Entities;
using TennisApp.Infrastructure.Data;
using TennisApp.Infrastructure.Services;

namespace TennisApp.Application.Services.Auth;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly JwtService _jwtService;
    private readonly PasswordHasher _passwordHasher;

    public AuthService(AppDbContext context, JwtService jwtService, PasswordHasher passwordHasher)
    {
        _context = context;
        _jwtService = jwtService;
        _passwordHasher = passwordHasher;
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto loginDto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

        if (user == null || !_passwordHasher.VerifyPassword(loginDto.Password, user.PasswordHash))
            return null;

        var token = _jwtService.GenerateToken(user);
        
        return new AuthResponseDto
        {
            Token = token,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            ExpiresAt = _jwtService.GetTokenExpiration()
        };
    }

    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto)
    {
        if (registerDto.Password != registerDto.ConfirmPassword)
            return null;

        var existingUser = await _context.Users
            .AnyAsync(u => u.Email == registerDto.Email);

        if (existingUser)
            return null;

        var user = new User
        {
            Email = registerDto.Email,
            FirstName = registerDto.FirstName,
            LastName = registerDto.LastName,
            PasswordHash = _passwordHasher.HashPassword(registerDto.Password),
            Role = "User",
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user);

        return new AuthResponseDto
        {
            Token = token,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            ExpiresAt = _jwtService.GetTokenExpiration()
        };
    }

    public Task<bool> ValidateTokenAsync(string token)
    {
        return Task.FromResult(_jwtService.ValidateToken(token));
    }
}