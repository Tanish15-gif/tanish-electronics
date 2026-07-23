namespace TanishElectronics.Api.DTOs.Admin.Feedback;

public class AdminRepairFeedbackDto
{
    public int CustomerRepairFeedbackId { get; set; }

    public int ServiceRequestId { get; set; }
    public string RequestNumber { get; set; } = string.Empty;

    public string CustomerName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }

    public string ServiceCategory { get; set; } = string.Empty;
    public string CurrentStatus { get; set; } = string.Empty;

    public int Rating { get; set; }
    public string? Comment { get; set; }

    public bool IsPublic { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}