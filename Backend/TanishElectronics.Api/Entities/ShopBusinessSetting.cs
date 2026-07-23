using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class ShopBusinessSetting
{
    public int ShopBusinessSettingId { get; set; }

    public string ShopName { get; set; } = null!;

    public string OwnerName { get; set; } = null!;

    public string PrimaryPhone { get; set; } = null!;

    public string SecondaryPhone { get; set; } = null!;

    public string WhatsAppNumber { get; set; } = null!;

    public string? Email { get; set; }

    public string Address { get; set; } = null!;

    public string City { get; set; } = null!;

    public string Area { get; set; } = null!;

    public string HomeVisitMessage { get; set; } = null!;

    public string OpeningHours { get; set; } = null!;

    public string BookingNotice { get; set; } = null!;

    public int LocalServiceRadiusKm { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime CreatedAt { get; set; }
}
