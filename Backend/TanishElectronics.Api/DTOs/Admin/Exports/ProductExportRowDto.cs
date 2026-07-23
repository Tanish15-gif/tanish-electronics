namespace TanishElectronics.Api.DTOs.Admin.Exports;

public class ProductExportRowDto
{
    public int ProductId { get; set; }

    public string ProductName { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? ModelName { get; set; }

    public string CategoryName { get; set; } = string.Empty;
    public string ConditionName { get; set; } = string.Empty;

    public decimal Price { get; set; }
    public int StockQuantity { get; set; }

    public bool IsAvailable { get; set; }
    public bool IsFeatured { get; set; }

    public DateTime CreatedAt { get; set; }
}