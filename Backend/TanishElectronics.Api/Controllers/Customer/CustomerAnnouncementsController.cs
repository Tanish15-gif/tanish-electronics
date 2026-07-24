using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers.Customer;

[ApiController]
[Authorize(Policy = AppPolicies.CustomerOnly)]
[EnableRateLimiting(RateLimitPolicies.PublicRead)]
[Route("customer/announcements")]
public class CustomerAnnouncementsController : ControllerBase
{
    private readonly IAnnouncementService _announcementService;
    private readonly ICurrentUserService _currentUserService;

    public CustomerAnnouncementsController(
        IAnnouncementService announcementService,
        ICurrentUserService currentUserService
    )
    {
        _announcementService = announcementService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAnnouncements(
        [FromQuery] string? location,
        [FromQuery] int limit = 6
    )
    {
        var result = await _announcementService.GetCustomerAnnouncementsAsync(
            string.IsNullOrWhiteSpace(location)
                ? "CustomerDashboard"
                : location,
            limit
        );

        return Ok(result);
    }

    [HttpGet("popup")]
    public async Task<IActionResult> GetPopupAnnouncement(
        [FromQuery] string? location
    )
    {
        var appUserId = await _currentUserService
            .GetRequiredCurrentAppUserIdAsync();

        var result = await _announcementService.GetCustomerPopupAnnouncementAsync(
            string.IsNullOrWhiteSpace(location)
                ? "CustomerDashboard"
                : location,
            appUserId
        );

        return Ok(result);
    }

    [HttpPost("{announcementId:int}/view")]
    public async Task<IActionResult> MarkAsViewed(int announcementId)
    {
        var appUserId = await _currentUserService
            .GetRequiredCurrentAppUserIdAsync();

        var updated = await _announcementService.MarkAnnouncementAsViewedAsync(
            announcementId,
            appUserId
        );

        if (!updated)
        {
            return NotFound(new { message = "Announcement not found." });
        }

        return Ok(new { message = "Announcement marked as viewed." });
    }
}