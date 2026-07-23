namespace TanishElectronics.Api.DTOs.Enquiries;

public class CreateEnquiryDto
{
    public int? ProductId { get; set; }
    public int? ServiceRequestId { get; set; }
    public string FullName { get; set; } = "";
    public string PhoneNumber { get; set; } = "";
    public string Email { get; set; } = "";

    public string? Subject { get; set; }
    public string Message { get; set; } = "";
}