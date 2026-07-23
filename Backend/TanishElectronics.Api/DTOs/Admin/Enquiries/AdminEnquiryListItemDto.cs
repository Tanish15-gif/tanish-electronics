namespace TanishElectronics.Api.DTOs.Admin.Enquiries;

public class AdminEnquiryListItemDto
{
    public int EnquiryId { get; set; }

    public string FullName { get; set; } = "";
    public string PhoneNumber { get; set; } = "";
    public string? Email { get; set; }

    public string? ProductName { get; set; }
    public string? Subject { get; set; }
    public string Message { get; set; } = "";

    public int StatusId { get; set; }
    public string Status { get; set; } = "";

    public DateTime CreatedAt { get; set; }
}