namespace TanishElectronics.Api.DTOs.Admin.Exports;

public class AdminFeedbackExportQueryDto
{
    public string? Search { get; set; }

    public bool? IsPublic { get; set; }

    public int? Rating { get; set; }
}