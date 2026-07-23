using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class AuditLog
{
    public int AuditLogId { get; set; }

    public int? AppUserId { get; set; }

    public string Action { get; set; } = null!;

    public string EntityName { get; set; } = null!;

    public int? EntityId { get; set; }

    public string? Description { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual AppUser? AppUser { get; set; }
}
