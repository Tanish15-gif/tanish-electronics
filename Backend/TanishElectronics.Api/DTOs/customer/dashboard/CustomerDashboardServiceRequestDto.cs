namespace TanishElectronics.Api.DTOs.Customer.DashBoard;

public class CustomerDashboardServiceRequestDto
{
    public int ServiceRequestId { get; set; }
    public string RequestNumber { get; set; } = string.Empty;
    public string ServiceCategory { get; set; } = string.Empty;
    public string CurrentStatus { get; set; } = string.Empty;
    public string ServiceType { get; set; } = string.Empty;

    public string? DeviceName { get; set; }
    public string? Brand { get; set; }
    public string? ModelName { get; set; }

    public DateOnly? PreferredDate { get; set; }
    public string? PreferredTimeSlot { get; set; }

    public DateTime CreatedAt { get; set; }
}