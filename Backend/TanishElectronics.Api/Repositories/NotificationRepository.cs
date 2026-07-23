using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Admin.Notifications;
using TanishElectronics.Api.DTOs.Customer.Notifications;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly TanishElectronicsDbContext _dbContext;
    public NotificationRepository(TanishElectronicsDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<List<GetAdminNotificationDto>> GetAdminNotification()
    {
        return await _dbContext.AdminNotifications
            .OrderByDescending(notification => notification.CreatedAt)
            .Select(notification => new GetAdminNotificationDto
            {
                AdminNotificationId = notification.AdminNotificationId,
                ServiceRequestId = notification.ServiceRequestId,
                EnquiryId = notification.EnquiryId,
                ProductId = notification.ProductId,
                Title = notification.Title,
                Message = notification.Message,
                NotificationType = notification.NotificationType,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt
            }).ToListAsync();
    }

    public async Task<bool> AdminMarkAsReadAsync(int notificationId)
    {
        var notification = await _dbContext.AdminNotifications
            .FirstOrDefaultAsync(notification =>
                notification.AdminNotificationId == notificationId);

        if (notification == null) return false;

        notification.IsRead = true;

        await _dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<bool> AdminMarkAllAsReadAsync()
    {
        var notifications = await _dbContext.AdminNotifications
            .Where(notification => !notification.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
        }
        await _dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<List<GetCustomerNotificatonDto>> GetByCustomerIdAsync(int customerId)
    {
        return await _dbContext.CustomerNotifications
            .Where(notification => notification.CustomerId == customerId)
            .OrderByDescending(notification => notification.CreatedAt)
            .Select(notification => new GetCustomerNotificatonDto
            {
                CustomerNotificationId = notification.CustomerNotificationId,
                ServiceRequestId = notification.ServiceRequestId,
                Title = notification.Title,
                Message = notification.Message,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt
            }).ToListAsync();
    }

    public async Task<bool> CustomerMarkAsReadAsync(int customerId, int notificationId)
    {
        var notification = await _dbContext.CustomerNotifications
            .Where(notification => notification.CustomerId == customerId)
            .FirstOrDefaultAsync(notification =>
                notification.CustomerNotificationId == notificationId);

        if (notification == null) return false;

        notification.IsRead = true;

        await _dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<bool> CustomerMarkAllAsReadAsync(int customerId)
    {
        var notifications = await _dbContext.CustomerNotifications
            .Where(notification => notification.CustomerId == customerId &&
                !notification.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
        }
        await _dbContext.SaveChangesAsync();
        return true;
    }
}