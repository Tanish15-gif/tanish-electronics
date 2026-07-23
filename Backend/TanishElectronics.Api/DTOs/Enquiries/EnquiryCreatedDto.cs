namespace TanishElectronics.Api.DTOs.Enquiries;

public class EnquiryCreatedDto
{
    public int EnquiryId { get; set; }
    public string Status { get; set; } = "";
    public string Message { get; set; } = "";
}