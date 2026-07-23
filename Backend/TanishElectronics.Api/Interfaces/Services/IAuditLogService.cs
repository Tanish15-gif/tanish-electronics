using TanishElectronics.Api.DTOs.Admin.AuditLogs;
using TanishElectronics.Api.DTOs.Common;

namespace TanishElectronics.Api.Interfaces.Services;

public interface IAuditLogService
{
    Task LogAsync(int? appUserId, string action, string entityName, int? entityId, string? description);

    Task<PagedResultDto<GetAdminAuditLogDto>> GetAdminAuditLogsAsync(AdminAuditLogQueryDto query);
}