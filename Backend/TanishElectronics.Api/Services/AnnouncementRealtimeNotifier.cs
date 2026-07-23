using Microsoft.AspNetCore.SignalR;
using TanishElectronics.Api.Hubs;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class AnnouncementRealtimeNotifier : IAnnouncementRealtimeNotifier
{
    private readonly IHubContext<AnnouncementHub> _hubContext;

    public AnnouncementRealtimeNotifier(IHubContext<AnnouncementHub> hubContext)
    {
        _hubContext = hubContext;
    }
    public async Task NotifyAnnouncementsChangedAsync(string location)
    {
        await _hubContext.Clients.All.SendAsync("AnnouncementChanged", new
        {
            location,
            changedAt = DateTime.Now
        });
    }
}