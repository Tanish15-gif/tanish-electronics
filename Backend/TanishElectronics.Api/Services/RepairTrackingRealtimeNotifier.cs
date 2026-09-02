using Microsoft.AspNetCore.SignalR;
using TanishElectronics.Api.DTOs.ServiceRequests;
using TanishElectronics.Api.Hubs;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class RepairTrackingRealtimeNotifier : IRepairTrackingRealtimeNotifier
{
    private readonly IHubContext<RepairTrackingHub> _hubContext;
    private readonly ILogger<RepairTrackingRealtimeNotifier> _logger;

    public RepairTrackingRealtimeNotifier(
        IHubContext<RepairTrackingHub> hubContext,
        ILogger<RepairTrackingRealtimeNotifier> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task NotifyRepairUpdatedAsync(string requestNumber, ServiceRequestTrackingDto trackingData)
    {
        if (string.IsNullOrWhiteSpace(requestNumber) || trackingData == null)
        {
            return;
        }

        try
        {
            var groupName = RepairTrackingGroups.ForRequest(requestNumber);
            await _hubContext.Clients.Group(groupName).SendAsync("ReceiveRepairUpdated", trackingData);
            _logger.LogInformation("Broadcasted real-time repair update to SignalR group '{Group}' for request '{RequestNumber}'", groupName, requestNumber);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to broadcast real-time repair update to SignalR for request '{RequestNumber}'", requestNumber);
        }
    }
}

