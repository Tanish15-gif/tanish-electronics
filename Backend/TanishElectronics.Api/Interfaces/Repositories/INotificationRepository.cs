using TanishElectronics.Api.DTOs.Admin.Notifications;
using TanishElectronics.Api.DTOs.Customer.Notifications;

namespace TanishElectronics.Api.Interfaces.Repositories;

public interface INotificationRepository
{
    //Admins
    Task<List<GetAdminNotificationDto>> GetAdminNotification();

    Task<bool> AdminMarkAsReadAsync(int notificationId);

    Task<bool> AdminMarkAllAsReadAsync();


    //Customers
    Task<List<GetCustomerNotificatonDto>> GetByCustomerIdAsync(int customerId);

    Task<bool> CustomerMarkAsReadAsync(int customerid, int notificationId);

    Task<bool> CustomerMarkAllAsReadAsync(int customerId);
}