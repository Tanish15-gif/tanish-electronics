namespace TanishElectronics.Api.DTOs.Admin.Enquiries;

public class AdminEnquiryDetailsDto
{
    public int EnquiryId { get; set; }

    public int? ProductId { get; set; }
    public string? ProductName { get; set; }
    public decimal? ProductPrice { get; set; }

    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }

    public string? Subject { get; set; }
    public string Message { get; set; } = string.Empty;

    public int StatusId { get; set; }
    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}