using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TennisApp.Application.DTOs.Auth;
using TennisApp.Application.Services.Auth;

namespace TennisApp.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.LoginAsync(loginDto);
        
        if (result == null)
            return Unauthorized(new { message = "Invalid email or password" });

        return Ok(result);
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.RegisterAsync(registerDto);
        
        if (result == null)
            return BadRequest(new { message = "Registration failed. Email may already be in use." });

        return Ok(result);
    }

    [HttpPost("validate")]
    [Authorize]
    public async Task<IActionResult> ValidateToken()
    {
        var token = Request.Headers["Authorization"]
            .FirstOrDefault()?.Split(" ").Last();

        if (string.IsNullOrEmpty(token))
            return Unauthorized();

        var isValid = await _authService.ValidateTokenAsync(token);
        
        return isValid ? Ok(new { valid = true }) : Unauthorized();
    }
}