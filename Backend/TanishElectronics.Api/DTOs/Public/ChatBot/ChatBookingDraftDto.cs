using System.ComponentModel.DataAnnotations;

namespace TanishElectronics.Api.DTOs.Public.ChatBot;

public sealed class ChatBookingDraftDto
{
    public string DraftId { get; set; } = "";
    public DateTime ExpiresAt { get; set; }
    public CreateServiceRequestDto Details { get; set; } = new();
    public string CategoryName { get; set; } = "";
    public string? LocationName { get; set; }
}

public sealed class ConfirmChatBookingDto
{
    [Required, MaxLength(100)] public string SessionKey { get; set; } = "";
    [Required, MaxLength(64)] public string DraftId { get; set; } = "";
}
