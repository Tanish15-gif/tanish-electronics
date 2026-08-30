using Microsoft.AspNetCore.SignalR;
using TanishElectronics.Api.DTOs.Admin.Notifications;
using TanishElectronics.Api.DTOs.Customer.Notifications;
using TanishElectronics.Api.Hubs;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class NotificationRealtimeNotifier : INotificationRealtimeNotifier
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationRealtimeNotifier(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyAdminsAsync(GetAdminNotificationDto notification)
    {
        await _hubContext.Clients
            .Group(NotificationGroups.Admins)
            .SendAsync("ReceiveAdminNotification", notification);
    }

    public async Task NotifyCustomerAsync(
        int customerId,
        GetCustomerNotificatonDto notification
    )
    {
        await _hubContext.Clients
            .Group(NotificationGroups.Customer(customerId))
            .SendAsync("ReceiveCustomerNotification", notification);
    }
}
