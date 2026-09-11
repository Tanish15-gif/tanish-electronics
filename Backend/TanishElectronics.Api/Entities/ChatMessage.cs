using System;

namespace TanishElectronics.Api.Entities;

public partial class ChatMessage
{
    public int ChatMessageId { get; set; }
    public int ChatSessionId { get; set; }
    public string UserMessage { get; set; } = null!;
    public string BotReply { get; set; } = null!;
    public string? CurrentPath { get; set; }
    public bool BookingCreated { get; set; }
    public bool EnquiryCreated { get; set; }
    public DateTime CreatedAt { get; set; }

    public virtual ChatSession ChatSession { get; set; } = null!;
}
