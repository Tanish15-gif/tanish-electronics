namespace TanishElectronics.Api.DTOs.Admin.Exports;

public class AdminAnnouncementExportQueryDto
{
    public string? Search { get; set; }

    public string? AnnouncementType { get; set; }

    public string? Audience { get; set; }

    public string? DisplayLocation { get; set; }

    public bool? IsActive { get; set; }
}