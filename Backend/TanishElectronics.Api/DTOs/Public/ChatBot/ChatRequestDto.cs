using System.ComponentModel.DataAnnotations;

namespace TanishElectronics.Api.DTOs.Public.ChatBot;

public class ChatRequestDto
{
    [Required(ErrorMessage = "Message cannot be empty")]
    [MaxLength(500, ErrorMessage = "Message is too long.")]
    public string Message { get; set; } = string.Empty;

    public List<ChatHistoryItemDto> History { get; set; } = new();

    public string? CurrentPath { get; set; }

    public string? SessionKey { get; set; }
}