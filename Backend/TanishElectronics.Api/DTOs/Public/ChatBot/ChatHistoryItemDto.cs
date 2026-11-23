using System.ComponentModel.DataAnnotations;
namespace TanishElectronics.Api.DTOs.Public.ChatBot;

public class ChatHistoryItemDto
{
    [Required, RegularExpression("^(user|assistant)$")]
    public string Role { get; set; } = string.Empty;

    [Required, MaxLength(4000)]
    public string Content { get; set; } = string.Empty;
}
