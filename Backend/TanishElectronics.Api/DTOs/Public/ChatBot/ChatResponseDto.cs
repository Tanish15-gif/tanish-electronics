namespace TanishElectronics.Api.DTOs.Public.ChatBot;

public class ChatResponseDto
{
    public string Reply { get; set; } = string.Empty;

    public List<ChatProductCardDto>? Products { get; set; }

    public List<ChatActionDto>? Actions { get; set; }
}