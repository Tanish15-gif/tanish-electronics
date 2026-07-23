namespace TanishElectronics.Api.DTOs.Admin.Exports;

public class WebsiteVisitExportRowDto
{
    public int WebsiteVisitId { get; set; }

    public Guid? VisitorId { get; set; }
    public int? AppUserId { get; set; }

    public string Path { get; set; } = string.Empty;
    public string? Referrer { get; set; }

    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; }
}