using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class CustomerRepairFeedback
{
    public int CustomerRepairFeedbackId { get; set; }

    public int ServiceRequestId { get; set; }

    public int CustomerId { get; set; }

    public int Rating { get; set; }

    public string? Comment { get; set; }

    public bool IsPublic { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Customer Customer { get; set; } = null!;

    public virtual ServiceRequest ServiceRequest { get; set; } = null!;
}
