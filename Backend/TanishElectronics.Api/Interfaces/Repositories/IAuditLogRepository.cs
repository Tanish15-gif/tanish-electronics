using TanishElectronics.Api.DTOs.Admin.AuditLogs;
using TanishElectronics.Api.DTOs.Admin.Enquiries;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Repositories;

public interface IAuditLogRepository
{
    Task AddAsync(AuditLog auditLog);
    Task<PagedResultDto<GetAdminAuditLogDto>> GetAdminAuditLogsAsync(AdminAuditLogQueryDto query);
}