using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Authorize(Policy = AppPolicies.AdminOnly)]
[EnableRateLimiting(RateLimitPolicies.AdminAction)]
[Route("admin/notifications")]
public class AdminNotificationsController : ControllerBase
{
    private readonly INotificationService _service;
    public AdminNotificationsController(INotificationService service)
    {
        _service = service;
    }
    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var notifications = await _service.GetAdminNotificationAsync();
        return Ok(notifications);
    }
    [HttpPut("{notificationId:int}/read")]
    public async Task<IActionResult> MarkAsRead(int notificationId)
    {
        await _service.AdminMarkAsReadAsync(notificationId);

        return Ok(new
        {
            message = "Notification marked as read."
        });
    }
    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        await _service.AdminMarkAllAsReadAsync();
        return Ok(new
        {
            message = "All notification marked as read"
        });
    }
}