using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class Announcement
{
    public int AnnouncementId { get; set; }

    public string Title { get; set; } = null!;

    public string Message { get; set; } = null!;

    public string AnnouncementType { get; set; } = null!;

    public string Audience { get; set; } = null!;

    public string DisplayLocation { get; set; } = null!;

    public string? ImageUrl { get; set; }

    public string? ButtonText { get; set; }

    public string? ButtonLink { get; set; }

    public DateTime? StartAt { get; set; }

    public DateTime? EndAt { get; set; }

    public int Priority { get; set; }

    public bool IsActive { get; set; }

    public bool ShowOnce { get; set; }

    public int? CreatedByAppUserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual ICollection<AnnouncementView> AnnouncementViews { get; set; } = new List<AnnouncementView>();

    public virtual AppUser? CreatedByAppUser { get; set; }
}
