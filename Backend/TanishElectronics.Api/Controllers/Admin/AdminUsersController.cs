using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Admin.Users;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Route("admin/users")]
[Authorize(Policy = AppPolicies.AdminOnly)]
[EnableRateLimiting(RateLimitPolicies.AdminAction)]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminUsersService _usersService;
    public AdminUsersController(IAdminUsersService usersService)
    {
        _usersService = usersService;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] AdminUsersQueryDto query)
    {
        var result = await _usersService.GetUsersAsync(query);

        return Ok(result);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var summary = await _usersService.GetSummaryAsync();

        return Ok(summary);
    }

    [HttpGet("{appUserId:int}")]
    public async Task<IActionResult> GetUserDetailsAsync(int appUserId)
    {
        var details = await _usersService.GetUserDetailsAsync(appUserId);
        return Ok(details);
    }
    [HttpPatch("{appUserId:int}/status")]
    public async Task<IActionResult> UpdateUserStatus(int appUserId, [FromBody] UpdateAdminUserStatusDto request)
    {
        await _usersService.SetUserActiveStatusAsync(
            appUserId,
            request.IsActive
        );

        return NoContent();
    }
    [HttpPost("{appUserId:int}/unlock")]
    public async Task<IActionResult> UnlockUser(int appUserId)
    {
        await _usersService.UnlockUserAsync(appUserId);

        return NoContent();
    }

    [HttpPost("{appUserId:int}/sessions/revoke-all")]
    public async Task<IActionResult> RevokeAllSessions(int appUserId)
    {
        await _usersService.RevokeAllUserSessionsAsync(
            appUserId
        );

        return NoContent();
    }
}