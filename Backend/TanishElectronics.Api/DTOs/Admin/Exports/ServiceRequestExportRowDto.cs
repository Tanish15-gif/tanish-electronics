namespace TanishElectronics.Api.DTOs.Admin.Exports;

public class ServiceRequestExportRowDto
{
    public int ServiceRequestId { get; set; }
    public string RequestNumber { get; set; } = string.Empty;

    public string CustomerName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;

    public string ServiceCategory { get; set; } = string.Empty;
    public string CurrentStatus { get; set; } = string.Empty;
    public string ServiceType { get; set; } = string.Empty;

    public DateOnly? PreferredDate { get; set; }
    public string? PreferredTimeSlot { get; set; }

    public DateTime CreatedAt { get; set; }
}