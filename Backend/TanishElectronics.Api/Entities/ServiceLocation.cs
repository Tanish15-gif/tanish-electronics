using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class ServiceLocation
{
    public int ServiceLocationId { get; set; }

    public string LocationName { get; set; } = null!;

    public string City { get; set; } = null!;

    public string? PinCode { get; set; }

    public bool IsHomeVisitAvailable { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ServiceRequest> ServiceRequests { get; set; } = new List<ServiceRequest>();
}
