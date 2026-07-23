using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class AdminNotification
{
    public int AdminNotificationId { get; set; }

    public int? ServiceRequestId { get; set; }

    public int? EnquiryId { get; set; }

    public int? ProductId { get; set; }

    public string Title { get; set; } = null!;

    public string Message { get; set; } = null!;

    public string NotificationType { get; set; } = null!;

    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Enquiry? Enquiry { get; set; }

    public virtual Product? Product { get; set; }

    public virtual ServiceRequest? ServiceRequest { get; set; }
}
