namespace TanishElectronics.Api.DTOs.Customer.Feedback;

public class CustomerRepairFeedbackDto
{
    public int CustomerRepairFeedbackId { get; set; }
    public int ServiceRequestId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public bool IsPublic { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}