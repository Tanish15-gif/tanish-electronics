namespace TanishElectronics.Api.DTOs.Customer.Repairs;

public class CustomerRepairImageDto
{
    public int ServiceRequestImageId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? OriginalFileName { get; set; }
    public DateTime CreatedAt { get; set; }
}