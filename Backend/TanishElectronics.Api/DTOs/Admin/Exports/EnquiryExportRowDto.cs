namespace TanishElectronics.Api.DTOs.Admin.Exports;

public class EnquiryExportRowDto
{
    public int EnquiryId { get; set; }

    public string CustomerName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }

    public string ProductName { get; set; } = string.Empty;
    public string StatusName { get; set; } = string.Empty;

    public string? Message { get; set; }

    public DateTime CreatedAt { get; set; }
}