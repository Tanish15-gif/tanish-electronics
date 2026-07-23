using System.ComponentModel.DataAnnotations;

namespace TanishElectronics.Api.DTOs.Admin.Enquiries;

public class CreateEnquiryNoteDto
{
    [Required]
    [MaxLength(1000)]
    public string Note { get; set; } = string.Empty;
}