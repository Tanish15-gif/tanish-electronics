using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Authorize(Policy = AppPolicies.CustomerOnly)]
[Route("customer/announcements")]
public class CustomerAnnouncementsController : ControllerBase
{
    private readonly IAnnouncementService _announcementService;
    private readonly TanishElectronicsDbContext _context;

    public CustomerAnnouncementsController(
        IAnnouncementService announcementService,
        TanishElectronicsDbContext context
    )
    {
        _announcementService = announcementService;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetCustomerAnnouncements
    (
        [FromQuery] string location = "CustomerDashboard",
        [FromQuery] int limit = 6
    )
    {
        var appUserId = await GetCurrentAppUserIdAsync();

        if (appUserId == null)
        {
            throw new UnauthorizedAccessException("User Not Found");
        }

        var result = await _announcementService.GetCustomerAnnouncementsAsync(location, limit);

        return Ok(result);
    }

    [HttpPost("{announcementId:int}/view")]
    public async Task<IActionResult> MarkAsViewed([FromRoute] int announcementId)
    {
        var appUserId = await GetCurrentAppUserIdAsync();

        if (appUserId == null)
        {
            throw new UnauthorizedAccessException("User Not Found");
        }

        var saved = await _announcementService.MarkAnnouncementAsViewedAsync(
            announcementId,
            appUserId.Value
        );

        if (!saved)
        {
            throw new KeyNotFoundException("Announcement not found.");
        }

        return Ok(new { message = "Announcement marked as viewed." });
    }

    private async Task<int?> GetCurrentAppUserIdAsync()
    {
        var clerkUserId =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(clerkUserId))
        {
            return null;
        }

        var appUser = await _context.AppUsers
            .FirstOrDefaultAsync(user => user.ClerkUserId == clerkUserId);

        return appUser?.AppUserId;
    }
    [HttpGet("popup")]
    public async Task<IActionResult> GetCustomerPopupAnnouncement(
        [FromQuery] string location = "CustomerDashboard"
    )
    {
        var appUserId = await GetCurrentAppUserIdAsync();

        if (appUserId == null)
        {
            throw new UnauthorizedAccessException("User Not Found");
        }

        var announcement =
            await _announcementService.GetCustomerPopupAnnouncementAsync(
                location,
                appUserId.Value
            );
        return Ok(announcement);
    }
}