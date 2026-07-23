namespace TanishElectronics.Api.DTOs.Admin.Products;

public class AdminProductDetailsDto
{
    public int ProductId { get; set; }

    public int ProductCategoryId { get; set; }
    public int ProductConditionId { get; set; }

    public string ProductName { get; set; } = "";

    public string? Brand { get; set; }
    public string? ModelName { get; set; }
    public string? Description { get; set; }

    public decimal Price { get; set; }
    public int StockQuantity { get; set; }

    public bool IsAvailable { get; set; }
    public bool IsFeatured { get; set; }

    public string? PrimaryImageUrl { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}