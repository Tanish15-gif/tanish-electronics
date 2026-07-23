namespace TanishElectronics.Api.DTOs.Admin.Settings;

public class AdminShopSettingsDto
{
    public int ShopBusinessSettingId { get; set; }

    public string ShopName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;

    public string PrimaryPhone { get; set; } = string.Empty;
    public string? SecondaryPhone { get; set; }
    public string WhatsAppNumber { get; set; } = string.Empty;
    public string? Email { get; set; }

    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;

    public string HomeVisitMessage { get; set; } = string.Empty;
    public string? OpeningHours { get; set; }
    public string? BookingNotice { get; set; }

    public int LocalServiceRadiusKm { get; set; }

    public DateTime? UpdatedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}