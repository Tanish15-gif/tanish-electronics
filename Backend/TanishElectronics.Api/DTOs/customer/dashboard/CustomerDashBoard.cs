namespace TanishElectronics.Api.DTOs.Customer.DashBoard;

public class CustomerDashBoardDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public int TotalRequest { get; set; }
    public int ActiveRequest { get; set; }
    public int CompletedRequest { get; set; }
    public int TotalEnquiries { get; set; }

    public List<CustomerDashboardServiceRequestDto> ServiceRequests { get; set; } = new();
    public List<CustomerDashboardEnquiryDto> Enquiries { get; set; } = new();

}