using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class CustomerAddress
{
    public int CustomerAddressId { get; set; }

    public int CustomerId { get; set; }

    public string? Label { get; set; }

    public string AddressLine { get; set; } = null!;

    public string City { get; set; } = null!;

    public string State { get; set; } = null!;

    public string Pincode { get; set; } = null!;

    public bool IsDefault { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Customer Customer { get; set; } = null!;

    public virtual ICollection<ServiceRequest> ServiceRequests { get; set; } = new List<ServiceRequest>();
}
