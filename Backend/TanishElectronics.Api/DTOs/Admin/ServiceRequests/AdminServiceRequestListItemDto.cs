namespace TanishElectronics.Api.DTOs.Admin.ServiceRequests;

public class AdminServiceRequestListItemDto
{
    public int ServiceRequestId { get; set; }
    public string RequestNumber { get; set; } = "";
    public string CustomerName { get; set; } = "";
    public string PhoneNumber { get; set; } = "";
    public string ServiceCategory { get; set; } = "";
    public string CurrentStatus { get; set; } = "";
    public string ServiceType { get; set; } = "";
    public DateOnly? PreferredDate { get; set; }
    public string PreferredTimeSlot { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}