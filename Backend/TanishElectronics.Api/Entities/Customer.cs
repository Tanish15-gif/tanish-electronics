using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class Customer
{
    public int CustomerId { get; set; }

    public int? AppUserId { get; set; }

    public string FullName { get; set; } = null!;

    public string PhoneNumber { get; set; } = null!;

    public string? Email { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual AppUser? AppUser { get; set; }

    public virtual ICollection<CustomerAddress> CustomerAddresses { get; set; } = new List<CustomerAddress>();

    public virtual ICollection<CustomerNotification> CustomerNotifications { get; set; } = new List<CustomerNotification>();

    public virtual ICollection<CustomerRepairFeedback> CustomerRepairFeedbacks { get; set; } = new List<CustomerRepairFeedback>();

    public virtual ICollection<Enquiry> Enquiries { get; set; } = new List<Enquiry>();

    public virtual ICollection<ServiceRequest> ServiceRequests { get; set; } = new List<ServiceRequest>();
}
