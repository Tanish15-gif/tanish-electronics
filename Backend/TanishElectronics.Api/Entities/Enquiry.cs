using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class Enquiry
{
    public int EnquiryId { get; set; }

    public int? CustomerId { get; set; }

    public int? ProductId { get; set; }

    public int? ServiceRequestId { get; set; }

    public string FullName { get; set; } = null!;

    public string PhoneNumber { get; set; } = null!;

    public string? Email { get; set; }

    public string? Subject { get; set; }

    public string Message { get; set; } = null!;

    public int EnquiryStatusId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual ICollection<AdminNotification> AdminNotifications { get; set; } = new List<AdminNotification>();

    public virtual Customer? Customer { get; set; }

    public virtual ICollection<EnquiryNote> EnquiryNotes { get; set; } = new List<EnquiryNote>();

    public virtual EnquiryStatus EnquiryStatus { get; set; } = null!;

    public virtual Product? Product { get; set; }

    public virtual ServiceRequest? ServiceRequest { get; set; }
}
