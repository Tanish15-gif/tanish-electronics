namespace TanishElectronics.Api.DTOs.Customer.Repairs;

public class UpsertCustomerRepairFeedbackDto
{
    public int Rating { get; set; }
    public string? Comment { get; set; }
}