using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class ChatSession
{
    public int      ChatSessionId { get; set; }
    public string   SessionKey    { get; set; } = null!;
    public int?     AppUserId     { get; set; }
    public string?  IpAddress     { get; set; }
    public string?  UserAgent     { get; set; }
    public DateTime StartedAt     { get; set; }
    public DateTime LastMessageAt { get; set; }
    public int      MessageCount  { get; set; }

    public virtual AppUser?                 AppUser  { get; set; }
    public virtual ICollection<ChatMessage> Messages { get; set; } = [];
}
