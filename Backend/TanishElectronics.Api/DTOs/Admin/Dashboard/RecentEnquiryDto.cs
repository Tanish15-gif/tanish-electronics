namespace TanishElectronics.Api.DTOs.Admin.Dashboard;

public class RecentEnquiryDto
{
    public int EnquiryId { get; set; }
    public string FullName { get; set; } = "";
    public string PhoneNumber { get; set; } = "";
    public string? ProductName { get; set; }
    public string Status { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}