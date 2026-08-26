namespace TanishElectronics.Api.DTOs.Public.ChatBot;

public class ChatStreamEventDto
{
    public string Type { get; set; } = "token"; // "token" | "metadata" | "done"
    public string? Content { get; set; }
    public List<ChatProductCardDto>? Products { get; set; }
    public List<ChatActionDto>? Actions { get; set; }
}

