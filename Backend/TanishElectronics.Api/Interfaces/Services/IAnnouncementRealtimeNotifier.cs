namespace TanishElectronics.Api.Interfaces.Services;

public interface IAnnouncementRealtimeNotifier
{
    Task NotifyAnnouncementsChangedAsync(string location);
}