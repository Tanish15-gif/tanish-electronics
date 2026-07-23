namespace TanishElectronics.Api.DTOs.Customer.Feedback;

public class CustomerRepairFeedbackCenterItemDto
{
    public int ServiceRequestId { get; set; }
    public string RequestNumber { get; set; } = string.Empty;

    public string ServiceCategory { get; set; } = string.Empty;
    public string CurrentStatus { get; set; } = string.Empty;

    public string? DeviceName { get; set; }
    public string? Brand { get; set; }
    public string? ModelName { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public bool CanGiveFeedback { get; set; }
    public bool HasFeedback { get; set; }

    public int? Rating { get; set; }
    public string? Comment { get; set; }
}