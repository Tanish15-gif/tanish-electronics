namespace TanishElectronics.Api.DTOs.Admin.Analytics;

public class AdminRecentVisitDto
{
    public int WebsiteVisitId { get; set; }
    public Guid? VisitorId { get; set; }
    public int? AppUserId { get; set; }
    public string Path { get; set; } = string.Empty;
    public string? Refferer { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; }
}