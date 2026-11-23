using System.ComponentModel.DataAnnotations;

namespace TanishElectronics.Api.DTOs.Public.ChatBot;

public class ChatRequestDto
{
    // Request only the authenticated account name and phone as booking context; identity comes from the validated session.
    public bool IncludeAccountContext { get; set; }
    [Required(ErrorMessage = "Message cannot be empty")]
    [MaxLength(500, ErrorMessage = "Message is too long.")]
    public string Message { get; set; } = string.Empty;

    [MaxLength(12)]
    public List<ChatHistoryItemDto> History { get; set; } = new();

    [MaxLength(500)]
    public string? CurrentPath { get; set; }

    [MaxLength(100)]
    public string? SessionKey { get; set; }
}
