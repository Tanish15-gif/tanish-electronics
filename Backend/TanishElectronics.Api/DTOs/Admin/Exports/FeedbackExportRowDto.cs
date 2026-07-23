namespace TanishElectronics.Api.DTOs.Admin.Exports;

public class FeedbackExportRowDto
{
    public int CustomerRepairFeedbackId { get; set; }

    public int ServiceRequestId { get; set; }
    public string RequestNumber { get; set; } = string.Empty;

    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;

    public int Rating { get; set; }
    public string? Comment { get; set; }

    public bool IsPublic { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}