using TanishElectronics.Api.DTOs.Admin.Notifications;
using TanishElectronics.Api.DTOs.Customer.Notifications;

namespace TanishElectronics.Api.Interfaces.Services;

public interface INotificationRealtimeNotifier
{
    Task NotifyAdminsAsync(GetAdminNotificationDto notification);

    Task NotifyCustomerAsync(int customerId, GetCustomerNotificatonDto notification);
}
