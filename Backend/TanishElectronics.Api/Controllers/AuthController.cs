using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using TanishElectronics.Api.DTOs.Auth;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("sync")]
    public async Task<IActionResult> Sync(SyncUserDto dto)
    {
        var clerkUserId = GetClerkUserId();
        var result = await _authService.SyncUserAsync(clerkUserId, dto);
        return Ok(result);
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var clerkUserId = GetClerkUserId();
        var result = await _authService.GetCurrentUserAsync(clerkUserId);
        return Ok(result);
    }

    private string GetClerkUserId()
    {
        var clerkUserId = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(clerkUserId))
        {
            throw new InvalidOperationException("Clerk user id was not found in token.");
        }
        return clerkUserId;
    }
}