namespace TanishElectronics.Api.DTOs.Admin.Enquiries;

public class AdminEnquiryQueryDto
{
    public int? StatusId { get; set; }
    public string? Search { get; set; }

    public int PageNumber { get; set; }
    public int PageSize { get; set; }
}