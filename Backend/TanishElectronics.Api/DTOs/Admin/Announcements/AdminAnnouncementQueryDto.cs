namespace TanishElectronics.Api.DTOs.Admin.Announcements;

public class AdminAnnouncementQueryDto
{
    public string? Search { get; set; }

    public string? AnnouncementType { get; set; }

    public string? Audience { get; set; }

    public string? DisplayLocation { get; set; }

    public bool? IsActive { get; set; }

    public int PageNumber { get; set; } = 1;

    public int PageSize { get; set; } = 10;
}