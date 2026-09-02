using TanishElectronics.Api.DTOs.ServiceRequests;

namespace TanishElectronics.Api.Interfaces.Services;

public interface IRepairTrackingRealtimeNotifier
{
    Task NotifyRepairUpdatedAsync(string requestNumber, ServiceRequestTrackingDto trackingData);
}

