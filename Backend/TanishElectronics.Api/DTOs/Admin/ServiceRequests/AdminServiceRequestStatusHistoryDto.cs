namespace TanishElectronics.Api.DTOs.Admin.ServiceRequests;

public class AdminServiceRequestStatusHistoryDto
{
    public string? OldStatus { get; set; }
    public string NewStatus { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime ChangedAt { get; set; }
}