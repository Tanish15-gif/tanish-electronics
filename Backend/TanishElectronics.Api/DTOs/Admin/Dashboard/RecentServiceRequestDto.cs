namespace TanishElectronics.Api.DTOs.Admin.Dashboard;

public class RecentServiceRequestDto
{
    public int ServiceRequestId { get; set; }
    public string RequestNumber { get; set; } = "";
    public string CustomerName { get; set; } = "";
    public string ServiceCategory { get; set; } = "";
    public string CurrentStatus { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}