using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class ServiceRequest
{
    public int ServiceRequestId { get; set; }

    public string RequestNumber { get; set; } = null!;

    public int? CustomerId { get; set; }

    public int? CustomerAddressId { get; set; }

    public string CustomerName { get; set; } = null!;

    public string PhoneNumber { get; set; } = null!;

    public string? Email { get; set; }

    public int ServiceCategoryId { get; set; }

    public string? DeviceName { get; set; }

    public string? Brand { get; set; }

    public string? ModelName { get; set; }

    public string IssueDescription { get; set; } = null!;

    public string ServiceType { get; set; } = null!;

    public string? VisitAddress { get; set; }

    public DateOnly? PreferredDate { get; set; }

    public string? PreferredTimeSlot { get; set; }

    public int CurrentStatusId { get; set; }

    public decimal? EstimatedPrice { get; set; }

    public decimal? FinalPrice { get; set; }

    public string? AdminNotes { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime? CancelledAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? ServiceLocationId { get; set; }

    public string PaymentStatus { get; set; } = null!;

    public DateTime? PaidAt { get; set; }

    public string? Diagnosis { get; set; }

    public string? WorkNotes { get; set; }

    public string? PartsUsed { get; set; }

    public bool ShowRepairNotesToCustomer { get; set; }

    public string? WarrantyNote { get; set; }

    public virtual ICollection<AdminNotification> AdminNotifications { get; set; } = new List<AdminNotification>();

    public virtual ServiceStatus CurrentStatus { get; set; } = null!;

    public virtual Customer? Customer { get; set; }

    public virtual CustomerAddress? CustomerAddress { get; set; }

    public virtual ICollection<CustomerNotification> CustomerNotifications { get; set; } = new List<CustomerNotification>();

    public virtual ICollection<CustomerRepairFeedback> CustomerRepairFeedbacks { get; set; } = new List<CustomerRepairFeedback>();

    public virtual ICollection<Enquiry> Enquiries { get; set; } = new List<Enquiry>();

    public virtual ICollection<ServiceAssignment> ServiceAssignments { get; set; } = new List<ServiceAssignment>();

    public virtual ServiceCategory ServiceCategory { get; set; } = null!;

    public virtual ServiceLocation? ServiceLocation { get; set; }

    public virtual ICollection<ServiceRequestImage> ServiceRequestImages { get; set; } = new List<ServiceRequestImage>();

    public virtual ICollection<ServiceRequestStatusHistory> ServiceRequestStatusHistories { get; set; } = new List<ServiceRequestStatusHistory>();
}
