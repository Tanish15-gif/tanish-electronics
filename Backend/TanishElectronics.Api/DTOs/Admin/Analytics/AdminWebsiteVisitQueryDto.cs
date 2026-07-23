namespace TanishElectronics.Api.DTOs.Admin.Analytics;

public class AdminWebsiteVisitQueryDto
{
    public string? Search { get; set; }

    public int PageNumber { get; set; } = 1;

    public int PageSize { get; set; } = 10;
}