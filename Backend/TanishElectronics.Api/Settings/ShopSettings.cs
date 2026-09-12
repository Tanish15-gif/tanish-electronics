namespace TanishElectronics.Api.Settings;

public class ShopSettings
{
    public string ShopName { get; set; } = string.Empty;

    public string OwnerName { get; set; } = string.Empty;

    public string PrimaryPhone { get; set; } = string.Empty;

    public string SecondaryPhone { get; set; } = string.Empty;

    public string WhatsAppNumber { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public string Area { get; set; } = string.Empty;

    public int LocalServiceRadiusKm { get; set; }
    public string HomeVisitMessage { get; set; } = string.Empty;
    public int MaxPublicAnnouncementLimit { get; set; }
    public int DefaultPublicAnnouncementLimit { get; set; }
    public int LowStockThreshold { get; set; }
    public int MaxUploadImageSizeMb { get; set; } = 5;
}