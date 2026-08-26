namespace TanishElectronics.Api.DTOs.Public.ChatBot;

public class ChatRequestDto
{
    public string Message { get; set; } = string.Empty;

    public List<ChatHistoryItemDto> History { get; set; } = new();

    public string? CurrentPath { get; set; }
}