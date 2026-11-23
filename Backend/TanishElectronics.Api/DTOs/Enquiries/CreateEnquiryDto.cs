using System.ComponentModel.DataAnnotations;
using TanishElectronics.Api.Helpers;

namespace TanishElectronics.Api.DTOs.Enquiries;

public class CreateEnquiryDto
{
    public int? ProductId { get; set; }
    public int? ServiceRequestId { get; set; }
    [Required, MaxLength(120)]
    public string FullName { get; set; } = "";
    [Required, MaxLength(20)]
    public string PhoneNumber { get; set; } = "";
    [OptionalEmail, MaxLength(150)]
    public string Email { get; set; } = "";

    [MaxLength(150)]
    public string? Subject { get; set; }
    [Required, MaxLength(1000)]
    public string Message { get; set; } = "";
}