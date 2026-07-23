namespace TanishElectronics.Api.DTOs.Admin.Announcements;

public class AdminAnnouncementDto
{
    public int AnnouncementId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    public string AnnouncementType { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string DisplayLocation { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    public string? ButtonText { get; set; }
    public string? ButtonLink { get; set; }

    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }

    public int Priority { get; set; }
    public bool IsActive { get; set; }
    public bool ShowOnce { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}