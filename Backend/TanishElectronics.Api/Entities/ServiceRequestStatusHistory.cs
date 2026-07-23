using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class ServiceRequestStatusHistory
{
    public int StatusHistoryId { get; set; }

    public int ServiceRequestId { get; set; }

    public int? OldStatusId { get; set; }

    public int NewStatusId { get; set; }

    public int? ChangedByAppUserId { get; set; }

    public string? Note { get; set; }

    public DateTime ChangedAt { get; set; }

    public virtual AppUser? ChangedByAppUser { get; set; }

    public virtual ServiceStatus NewStatus { get; set; } = null!;

    public virtual ServiceStatus? OldStatus { get; set; }

    public virtual ServiceRequest ServiceRequest { get; set; } = null!;
}
