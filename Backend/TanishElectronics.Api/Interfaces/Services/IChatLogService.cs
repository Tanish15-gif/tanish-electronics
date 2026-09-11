using System;
using System.Threading.Tasks;
using TanishElectronics.Api.DTOs.Admin.ChatLogs;
using TanishElectronics.Api.DTOs.Common;

namespace TanishElectronics.Api.Interfaces.Services;

public interface IChatLogService
{
    Task SaveMessageAsync(
        string sessionKey, int? appUserId,
        string userMessage, string botReply,
        string? currentPath,
        bool bookingCreated, bool enquiryCreated,
        string? ipAddress, string? userAgent);

    Task<PagedResultDto<ChatLogItemDto>> GetLogsAsync(
        int page, int pageSize,
        string? search, DateTime? from, DateTime? to);

    Task<ChatSessionDetailDto> GetSessionAsync(int sessionId);
    Task<ChatLogStatsDto> GetStatsAsync();
}

