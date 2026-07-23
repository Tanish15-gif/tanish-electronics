using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class ServiceRequestImage
{
    public int ServiceRequestImageId { get; set; }

    public int ServiceRequestId { get; set; }

    public string ImageUrl { get; set; } = null!;

    public string? OriginalFileName { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ServiceRequest ServiceRequest { get; set; } = null!;
}
