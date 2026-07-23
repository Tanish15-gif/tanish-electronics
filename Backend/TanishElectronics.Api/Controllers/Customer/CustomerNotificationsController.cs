using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Authorize(Policy = AppPolicies.CustomerOnly)]
[Route("CustomerNotifications")]
public class CustomerNotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    public CustomerNotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }
    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var notifications = await _notificationService.GetCurrentCustomerNotificationsAsync();
        return Ok(notifications);
    }
    [HttpPut("{notificationId:int}/read")]
    public async Task<IActionResult> MarkAsRead(int notificationId)
    {
        var notification = await _notificationService.CustomerMarkAsReadAsync(notificationId);

        if (!notification)
        {
            throw new KeyNotFoundException("Notification not found");
        }

        return Ok(new
        {
            message = "Notification marked as read."
        });
    }
    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        await _notificationService.CustomerMarkAllAsReadAsync();

        return Ok(new
        {
            message = "All notification marked as read"
        });
    }
}