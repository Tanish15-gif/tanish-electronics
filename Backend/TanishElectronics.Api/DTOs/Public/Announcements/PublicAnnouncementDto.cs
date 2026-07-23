namespace TanishElectronics.Api.DTOs.Public.Announcements;

public class PublicAnnouncementDto
{
    public int AnnouncementId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    public string AnnouncementType { get; set; } = string.Empty;
    public string DisplayLocation { get; set; } = string.Empty;

    public string Audience { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    public string? ButtonText { get; set; }
    public string? ButtonLink { get; set; }

    public int Priority { get; set; }
    public bool ShowOnce { get; set; }

    public DateTime? EndAt { get; set; }
}