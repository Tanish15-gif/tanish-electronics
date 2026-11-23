using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.Services.Security;

namespace TanishElectronics.Api.Hubs;

public class RepairTrackingHub(TanishElectronicsDbContext db, RepairAccessService access, LiveConnectionRegistry registry) : Hub
{
    public async Task JoinTracking(string requestNumber, string? trackingToken = null)
    {
        if (string.IsNullOrWhiteSpace(requestNumber) || requestNumber.Length > 40)
        {
            return;
        }

        var repairId = await db.ServiceRequests.Where(r => r.RequestNumber == requestNumber.Trim() && r.DeletedAt == null)
            .Select(r => (int?)r.ServiceRequestId).FirstOrDefaultAsync();
        if (!repairId.HasValue || (!access.HasTrackingToken(requestNumber, trackingToken) && !await access.CanAccessAsync(repairId.Value)))
            throw new HubException("Repair access denied. Verify your tracking details again.");
        var groupName = RepairTrackingGroups.ForRequest(requestNumber);
        var joined = Context.Items.TryGetValue("TrackingGroups", out var existing) ? (HashSet<string>)existing! : new HashSet<string>();
        if (joined.Count >= 5 && !joined.Contains(groupName)) throw new HubException("Maximum five tracking subscriptions per connection.");
        if (Context.User?.Identity?.IsAuthenticated != true && access.TrackingExpiry(requestNumber, trackingToken) is DateTime expiresAt &&
            registry.Connections.TryGetValue(Context.ConnectionId, out var connection))
            registry.Connections[Context.ConnectionId] = connection with { ExpiresAt = new[] { connection.ExpiresAt, expiresAt }.Min() };
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        joined.Add(groupName);
        Context.Items["TrackingGroups"] = joined;
    }

    public async Task LeaveTracking(string requestNumber)
    {
        if (string.IsNullOrWhiteSpace(requestNumber))
        {
            return;
        }

        var groupName = RepairTrackingGroups.ForRequest(requestNumber);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        if (Context.Items.TryGetValue("TrackingGroups", out var groups)) ((HashSet<string>)groups!).Remove(groupName);
    }
}

public static class RepairTrackingGroups
{
    public static string ForRequest(string requestNumber) =>
        $"Tracking_{requestNumber.Trim().ToUpperInvariant()}";
}

