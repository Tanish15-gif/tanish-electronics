namespace TanishElectronics.Api.DTOs.Admin.Feedback;

public class AdminFeedbackQueryDto
{
    public string? Search { get; set; }

    public bool? IsPublic { get; set; }

    public int? Rating { get; set; }

    public int PageNumber { get; set; } = 1;

    public int PageSize { get; set; } = 10;
}