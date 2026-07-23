using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Admin.Analytics;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Authorize(Policy = AppPolicies.AdminOnly)]
[EnableRateLimiting(RateLimitPolicies.AdminAction)]
[Route("admin/analytics")]
public class AdminAnalyticsController : ControllerBase
{
    private readonly IWebsiteVisitService _visitService;

    public AdminAnalyticsController(IWebsiteVisitService visitService)
    {
        _visitService = visitService;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var summary = await _visitService.GetAdminAnalyticsSummaryAsync();

        return Ok(summary);
    }

    [HttpGet("website-visits")]
    public async Task<IActionResult> GetWebsiteVisits(
        [FromQuery] AdminWebsiteVisitQueryDto query
    )
    {
        var result = await _visitService.GetAdminWebsiteVisitsAsync(query);

        return Ok(result);
    }
}