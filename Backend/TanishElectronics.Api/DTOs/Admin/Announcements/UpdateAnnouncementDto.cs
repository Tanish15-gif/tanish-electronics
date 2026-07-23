namespace TanishElectronics.Api.DTOs.Admin.Announcements;

public class UpdateAnnouncementDto
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    public string AnnouncementType { get; set; } = "ServiceAlert";
    public string Audience { get; set; } = "All";
    public string DisplayLocation { get; set; } = "Homepage";

    public string? ImageUrl { get; set; }

    public string? ButtonText { get; set; }
    public string? ButtonLink { get; set; }

    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }

    public int Priority { get; set; } = 2;
    public bool IsActive { get; set; } = true;
    public bool ShowOnce { get; set; } = true;
}
