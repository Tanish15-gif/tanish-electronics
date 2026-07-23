using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class CustomerNotification
{
    public int CustomerNotificationId { get; set; }

    public int CustomerId { get; set; }

    public int? ServiceRequestId { get; set; }

    public string Title { get; set; } = null!;

    public string Message { get; set; } = null!;

    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Customer Customer { get; set; } = null!;

    public virtual ServiceRequest? ServiceRequest { get; set; }
}
