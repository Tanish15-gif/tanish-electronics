namespace TanishElectronics.Api.DTOs.Admin.ServiceRequests;

public class AdminServiceRequestQueryDto
{
    public int? StatusId { get; set; }
    public string? Search { get; set; }

    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}