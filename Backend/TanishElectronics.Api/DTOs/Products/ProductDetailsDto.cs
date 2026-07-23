namespace TanishElectronics.Api.DTOs.Products;

public class ProductDetailsDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public string CategoryName { get; set; } = "";
    public string ConditionName { get; set; } = "";
    public string? Brand { get; set; }
    public string? ModelName { get; set; }
    public string? Description { get; set; }
    public string? PrimaryImageUrl { get; set; }
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public bool IsAvailable { get; set; }
    public bool IsFeatured { get; set; }
    public List<string> ImageUrls { get; set; } = new();
}