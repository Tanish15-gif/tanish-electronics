using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class ServiceAssignment
{
    public int ServiceAssignmentId { get; set; }

    public int ServiceRequestId { get; set; }

    public int AssignedToAppUserId { get; set; }

    public int? AssignedByAppUserId { get; set; }

    public DateTime AssignedAt { get; set; }

    public bool IsActive { get; set; }

    public virtual AppUser? AssignedByAppUser { get; set; }

    public virtual AppUser AssignedToAppUser { get; set; } = null!;

    public virtual ServiceRequest ServiceRequest { get; set; } = null!;
}
