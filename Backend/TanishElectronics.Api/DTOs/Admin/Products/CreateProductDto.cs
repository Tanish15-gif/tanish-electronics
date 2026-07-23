namespace TanishElectronics.Api.DTOs.Products;

public class CreateProductDto
{
    public int ProductCategoryId { get; set; }
    public int ProductConditionId { get; set; }

    public string ProductName { get; set; } = "";

    public string? Brand { get; set; }
    public string? ModelName { get; set; }
    public string? Description { get; set; }

    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public string? AnnouncementTitle { get; set; }
    public string? AnnouncementMessage { get; set; }
    public int AnnouncementPriority { get; set; }
    public DateTime? AnnouncementEndAt { get; set; }
    public bool CreateAnnouncement { get; set; }
    public bool IsAvailable { get; set; } = true;
    public bool IsFeatured { get; set; } = false;
}