namespace TanishElectronics.Api.DTOs.Admin.ServiceRequests;

public class AdminServiceRequestImageDto
{
    public int ServiceRequestImageId { get; set; }

    public string ImageUrl { get; set; } = string.Empty;

    public string? OriginalFileName { get; set; }

    public DateTime CreatedAt { get; set; }
}