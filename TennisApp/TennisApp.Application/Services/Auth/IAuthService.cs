using TennisApp.Application.DTOs.Auth;

namespace TennisApp.Application.Services.Auth;

public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(LoginDto loginDto);
    Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto);
    Task<bool> ValidateTokenAsync(string token);
}