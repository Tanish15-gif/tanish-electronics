using TanishElectronics.Api.DTOs.Public.ChatBot;

namespace TanishElectronics.Api.Interfaces.Services;

public interface IChatbotService
{
    Task<ChatResponseDto> GetReplyAsync(ChatRequestDto dto);
    IAsyncEnumerable<ChatStreamEventDto> StreamReplyAsync(ChatRequestDto dto, CancellationToken cancellationToken = default);
}