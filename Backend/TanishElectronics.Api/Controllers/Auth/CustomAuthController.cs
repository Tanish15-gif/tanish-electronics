using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Auth.Custom;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[EnableRateLimiting(RateLimitPolicies.FormSubmit)]
[Route("auth/custom")]
public class CustomAuthController : ControllerBase
{
    private readonly ICustomAuthService _authService;
    public CustomAuthController(ICustomAuthService authService)
    {
        _authService = authService;
    }
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
    {
        var result = await _authService.RegisterAsync(dto);

        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        var result = await _authService.LoginAsync(dto);

        return Ok(result);
    }
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto dto)
    {
        var result = await _authService.RefreshAsync(dto);

        return Ok(result);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutRequestDto dto)
    {
        await _authService.LogoutAsync(dto);

        return Ok(new { message = "Logged out successfully." });
    }
    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequestDto dto)
    {
        var result = await _authService.GoogleLoginAsync(dto);

        return Ok(result);
    }
}