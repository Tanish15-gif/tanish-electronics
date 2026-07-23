using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class WebsiteVisit
{
    public int WebsiteVisitId { get; set; }

    public Guid? VisitorId { get; set; }

    public int? AppUserId { get; set; }

    public string Path { get; set; } = null!;

    public string? Referrer { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual AppUser? AppUser { get; set; }
}
