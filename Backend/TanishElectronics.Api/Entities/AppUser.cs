using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class AppUser
{
    public int AppUserId { get; set; }

    public string ClerkUserId { get; set; } = null!;

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? PhoneNumber { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual ICollection<AnnouncementView> AnnouncementViews { get; set; } = new List<AnnouncementView>();

    public virtual ICollection<Announcement> Announcements { get; set; } = new List<Announcement>();

    public virtual ICollection<AppUserRole> AppUserRoles { get; set; } = new List<AppUserRole>();

    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    public virtual Customer? Customer { get; set; }

    public virtual ICollection<ServiceAssignment> ServiceAssignmentAssignedByAppUsers { get; set; } = new List<ServiceAssignment>();

    public virtual ICollection<ServiceAssignment> ServiceAssignmentAssignedToAppUsers { get; set; } = new List<ServiceAssignment>();

    public virtual ICollection<ServiceRequestStatusHistory> ServiceRequestStatusHistories { get; set; } = new List<ServiceRequestStatusHistory>();

    public virtual ICollection<WebsiteVisit> WebsiteVisits { get; set; } = new List<WebsiteVisit>();
}
