using TanishElectronics.Api.DTOs.Admin.Notifications;
using TanishElectronics.Api.DTOs.Customer.Notifications;

namespace TanishElectronics.Api.Interfaces.Services;

public interface INotificationService
{
    Task<List<GetAdminNotificationDto>> GetAdminNotificationAsync();

    Task<bool> AdminMarkAsReadAsync(int notificationId);

    Task<bool> AdminMarkAllAsReadAsync();


    Task<List<GetCustomerNotificatonDto>> GetCurrentCustomerNotificationsAsync();

    Task<bool> CustomerMarkAsReadAsync(int notificationId);

    Task<bool> CustomerMarkAllAsReadAsync();
}