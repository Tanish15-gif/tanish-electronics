using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Admin.AuditLogs;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class AuditLogService : IAuditLogService
{
    private readonly IAuditLogRepository _logRepository;
    private readonly IHttpContextAccessor _contextAccessor;
    public AuditLogService(IAuditLogRepository logRepository, IHttpContextAccessor contextAccessor)
    {
        _logRepository = logRepository;
        _contextAccessor = contextAccessor;
    }

    public async Task LogAsync(int? appUserId, string action, string entityName, int? entityId, string? description)
    {
        var httpcontext = _contextAccessor.HttpContext;

        var auditlog = new AuditLog
        {
            AppUserId = appUserId,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            Description = description,
            IpAddress = GetClientIpAddress(httpcontext),
            UserAgent = httpcontext?.Request.Headers.UserAgent.ToString(),
            CreatedAt = DateTime.Now
        };
        await _logRepository.AddAsync(auditlog);
    }

    public async Task<PagedResultDto<GetAdminAuditLogDto>> GetAdminAuditLogsAsync(AdminAuditLogQueryDto query)
    {
        query.PageNumber = Math.Max(query.PageNumber, 1);
        query.PageSize = Math.Clamp(query.PageSize, 10, 100);

        return await _logRepository.GetAdminAuditLogsAsync(query);
    }

    public static string? GetClientIpAddress(HttpContext? httpContext)
    {
        if (httpContext == null) return null;

        var forwardFor = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(forwardFor)) return forwardFor.Split(",")[0].Trim();

        return httpContext.Connection.RemoteIpAddress?.ToString();
    }
}