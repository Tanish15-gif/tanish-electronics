namespace TanishElectronics.Api.DTOs.Admin.Dashboard;

public class AdminDashboardSummaryDto
{
    public int TotalServiceRequests { get; set; }
    public int PendingServiceRequests { get; set; }
    public int InProgressServiceRequests { get; set; }
    public int CompletedServiceRequests { get; set; }

    public int TotalEnquiries { get; set; }
    public int NewEnquiries { get; set; }

    public int TotalProducts { get; set; }
    public int AvailableProducts { get; set; }
    public int FeaturedProducts { get; set; }
    public int LowStockProducts { get; set; }

    public List<RecentServiceRequestDto> RecentServiceRequests { get; set; } = new();
    public List<RecentEnquiryDto> RecentEnquiries { get; set; } = new();
}