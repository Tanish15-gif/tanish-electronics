namespace TanishElectronics.Api.DTOs.Customer.DashBoard;

public class CustomerDashboardEnquiryDto
{
    public int? EnquiryId { get; set; }
    public int? ProductId { get; set; }
    public string? ProductName { get; set; }
    public string? Subject { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}