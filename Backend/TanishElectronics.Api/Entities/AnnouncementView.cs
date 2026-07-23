using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class AnnouncementView
{
    public int AnnouncementViewId { get; set; }

    public int AnnouncementId { get; set; }

    public int AppUserId { get; set; }

    public DateTime ViewedAt { get; set; }

    public virtual Announcement Announcement { get; set; } = null!;

    public virtual AppUser AppUser { get; set; } = null!;
}
