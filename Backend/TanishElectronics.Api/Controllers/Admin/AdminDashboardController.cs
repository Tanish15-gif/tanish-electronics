using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.Filters;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Authorize(Policy = AppPolicies.AdminOnly)]
[EnableRateLimiting(RateLimitPolicies.AdminAction)]
[Route("admin/dashboard")]
public class AdminDashboardController : ControllerBase
{
    private readonly IAdminDashboardService _dashboardService;
    public AdminDashboardController(IAdminDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var summary = await _dashboardService.GetSummaryAsync();
        return Ok(summary);
    }
}