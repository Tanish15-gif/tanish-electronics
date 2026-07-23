namespace TanishElectronics.Api.DTOs.Public;

public class PublicShopSettingsDto
{
    public string ShopName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;

    public string PrimaryPhone { get; set; } = string.Empty;
    public string? SecondaryPhone { get; set; }
    public string WhatsAppNumber { get; set; } = string.Empty;
    public string? Email { get; set; }

    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty;

    public int LocalServiceRadiusKm { get; set; }
    public string HomeVisitMessage { get; set; } = string.Empty;
    public string? OpeningHours { get; set; }
    public string? BookingNotice { get; set; }
}