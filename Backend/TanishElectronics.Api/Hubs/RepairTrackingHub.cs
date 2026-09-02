using Microsoft.AspNetCore.SignalR;

namespace TanishElectronics.Api.Hubs;

public class RepairTrackingHub : Hub
{
    public async Task JoinTracking(string requestNumber)
    {
        if (string.IsNullOrWhiteSpace(requestNumber))
        {
            return;
        }

        var groupName = RepairTrackingGroups.ForRequest(requestNumber);
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task LeaveTracking(string requestNumber)
    {
        if (string.IsNullOrWhiteSpace(requestNumber))
        {
            return;
        }

        var groupName = RepairTrackingGroups.ForRequest(requestNumber);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }
}

public static class RepairTrackingGroups
{
    public static string ForRequest(string requestNumber) =>
        $"Tracking_{requestNumber.Trim().ToUpperInvariant()}";
}

