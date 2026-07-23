namespace TanishElectronics.Api.Events.Products;

public class ProductCreatedEventArgs : EventArgs
{
    public int ProductId { get; set; }

    public string ProductName { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? ModelName { get; set; }

    public decimal Price { get; set; }
    public int StockQuantity { get; set; }

    public bool CreateAnnouncement { get; set; }

    public string? AnnouncementTitle { get; set; }
    public string? AnnouncementMessage { get; set; }

    public int AnnouncementPriority { get; set; }
    public DateTime? AnnouncementEndAt { get; set; }
}