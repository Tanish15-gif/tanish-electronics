using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class AppUser
{
    public int AppUserId { get; set; }

    public string? ClerkUserId { get; set; }

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? PhoneNumber { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public string? PasswordHash { get; set; }

    public string? NormalizedEmail { get; set; }

    public bool EmailConfirmed { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public DateTime? LastSeenAt { get; set; }

    public DateTime? LastLogoutAt { get; set; }

    public int AccessFailedCount { get; set; }

    public DateTime? LockoutEndAt { get; set; }

    public DateTime? PasswordUpdatedAt { get; set; }

    public string? ProfileImageUrl { get; set; }

    public string? ProfileImageSource { get; set; }

    public DateTime? ProfileImageUpdatedAt { get; set; }

    public virtual ICollection<AnnouncementView> AnnouncementViews { get; set; } = new List<AnnouncementView>();

    public virtual ICollection<Announcement> Announcements { get; set; } = new List<Announcement>();

    public virtual ICollection<AppUserRole> AppUserRoles { get; set; } = new List<AppUserRole>();

    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    public virtual Customer? Customer { get; set; }

    public virtual ICollection<ExternalLogin> ExternalLogins { get; set; } = new List<ExternalLogin>();

    public virtual ICollection<OtpCode> OtpCodes { get; set; } = new List<OtpCode>();

    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public virtual ICollection<ServiceAssignment> ServiceAssignmentAssignedByAppUsers { get; set; } = new List<ServiceAssignment>();

    public virtual ICollection<ServiceAssignment> ServiceAssignmentAssignedToAppUsers { get; set; } = new List<ServiceAssignment>();

    public virtual ICollection<ServiceRequestStatusHistory> ServiceRequestStatusHistories { get; set; } = new List<ServiceRequestStatusHistory>();

    public virtual ICollection<UserAuthEvent> UserAuthEvents { get; set; } = new List<UserAuthEvent>();

    public virtual ICollection<WebsiteVisit> WebsiteVisits { get; set; } = new List<WebsiteVisit>();
}
