namespace TanishElectronics.Api.DTOs.Public.Feedbacks;

public class PublicRepairFeedbackDto
{
    public int CustomerRepairsFeedbackId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string ServiceCategory { get; set; } = string.Empty;

    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}