namespace TanishElectronics.Api.DTOs.Admin.Enquiries;

public class EnquiryNoteDto
{
    public int EnquiryNoteId { get; set; }
    public int EnquiryId { get; set; }
    public string Note { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}