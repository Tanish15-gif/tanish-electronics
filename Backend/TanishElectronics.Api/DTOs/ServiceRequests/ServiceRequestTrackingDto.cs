namespace TanishElectronics.Api.DTOs.ServiceRequests;

public class ServiceRequestTrackingDto
{
    public string RequestNumber { get; set; } = "";
    public string CustomerName { get; set; } = "";
    public string PhoneNumber { get; set; } = "";

    public string ServiceCategory { get; set; } = "";
    public string CurrentStatus { get; set; } = "";

    public string? DeviceName { get; set; }
    public string? Brand { get; set; }
    public string? ModelName { get; set; }

    public string IssueDescription { get; set; } = "";
    public string ServiceType { get; set; } = "";

    public DateOnly? PreferredDate { get; set; }
    public string? PreferredTimeSlot { get; set; }

    public decimal? EstimatedPrice { get; set; }
    public decimal? FinalPrice { get; set; }


    public DateTime CreatedAt { get; set; }
}