using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Authorize(Policy = AppPolicies.AdminOnly)]
[EnableRateLimiting(RateLimitPolicies.AdminAction)]
[Route("admin/chat-logs")]
public class AdminChatLogsController : ControllerBase
{
    private readonly IChatLogService _chatLogService;

    public AdminChatLogsController(IChatLogService chatLogService)
        => _chatLogService = chatLogService;

    [HttpGet]
    public async Task<IActionResult> GetLogs(
        [FromQuery] int page          = 1,
        [FromQuery] int pageSize      = 20,
        [FromQuery] string? search    = null,
        [FromQuery] DateTime? from    = null,
        [FromQuery] DateTime? to      = null)
    {
        var result = await _chatLogService.GetLogsAsync(page, pageSize, search, from, to);
        return Ok(result);
    }

    [HttpGet("{sessionId:int}")]
    public async Task<IActionResult> GetSession(int sessionId)
    {
        var session = await _chatLogService.GetSessionAsync(sessionId);
        return Ok(session);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _chatLogService.GetStatsAsync();
        return Ok(stats);
    }
}
