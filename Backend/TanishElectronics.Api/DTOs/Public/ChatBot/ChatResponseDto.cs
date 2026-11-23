namespace TanishElectronics.Api.DTOs.Public.ChatBot;

public class ChatResponseDto
{
    public ChatBookingDraftDto? BookingDraft { get; set; }
    public TanishElectronics.Api.DTOs.ServiceRequests.ServiceRequestTrackingDto? Tracking { get; set; }
    public string Reply { get; set; } = string.Empty;

    public List<ChatProductCardDto>? Products { get; set; }

    public List<ChatActionDto>? Actions { get; set; }
}
