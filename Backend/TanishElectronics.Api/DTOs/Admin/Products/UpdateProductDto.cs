namespace TanishElectronics.Api.DTOs.Admin.Products;

public class UpdateProductDto
{
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
}