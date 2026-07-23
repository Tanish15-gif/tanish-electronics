using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Admin.AuditLogs;
using TanishElectronics.Api.DTOs.Admin.Enquiries;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;

namespace TanishElectronics.Api.Repositories;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly TanishElectronicsDbContext _dbContext;
    public AuditLogRepository(TanishElectronicsDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task AddAsync(AuditLog auditLog)
    {
        _dbContext.AuditLogs.Add(auditLog);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<PagedResultDto<GetAdminAuditLogDto>> GetAdminAuditLogsAsync(AdminAuditLogQueryDto query)
    {
        var PageNumber = Math.Max(query.PageNumber, 1);
        var pageSize = Math.Clamp(query.PageSize, 10, 100);

        var auditQuery =
            from auditlog in _dbContext.AuditLogs.AsNoTracking()
            join appUser in _dbContext.AppUsers.AsNoTracking()
                on auditlog.AppUserId equals appUser.AppUserId into appUserJoin
            from appUser in appUserJoin.DefaultIfEmpty()
            select new
            {
                auditlog,
                appUser
            };

        if (!string.IsNullOrWhiteSpace(query.Action))
        {
            var action = query.Action.Trim();

            auditQuery = auditQuery.Where(x => x.auditlog.Action == action);
        }
        if (!string.IsNullOrWhiteSpace(query.EntityName))
        {
            var entityName = query.EntityName.Trim();

            auditQuery = auditQuery.Where(x =>
                x.auditlog.EntityName == entityName
            );
        }
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();

            auditQuery = auditQuery.Where(x =>
                x.auditlog.Action.Contains(search) ||
                x.auditlog.EntityName.Contains(search) ||
                (x.auditlog.Description != null &&
                    x.auditlog.Description.Contains(search)) ||
                (x.auditlog.IpAddress != null &&
                    x.auditlog.IpAddress.Contains(search)) ||
                (x.appUser != null &&
                    (
                        x.appUser.FullName.Contains(search) ||
                        x.appUser.Email.Contains(search)
                    ))
            );
        }
        var totalRecords = await auditQuery.CountAsync();

        var totalPages = (int)Math.Ceiling(totalRecords / (double)pageSize);

        var items = await auditQuery
            .OrderByDescending(x => x.auditlog.CreatedAt)
            .Skip((PageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new GetAdminAuditLogDto
            {
                AuditLogId = x.auditlog.AuditLogId,

                AppUserId = x.auditlog.AppUserId,
                AdminName = x.appUser != null ? x.appUser.FullName : null,
                AdminEmail = x.appUser != null ? x.appUser.Email : null,

                Action = x.auditlog.Action,
                EntityName = x.auditlog.EntityName,
                EntityId = x.auditlog.EntityId,

                Description = x.auditlog.Description,
                IpAddress = x.auditlog.IpAddress,
                UserAgent = x.auditlog.UserAgent,

                CreatedAt = x.auditlog.CreatedAt
            })
            .ToListAsync();

        return new PagedResultDto<GetAdminAuditLogDto>
        {
            Items = items,
            PageNumber = PageNumber,
            PageSize = pageSize,
            TotalRecords = totalRecords,
            TotalPages = Math.Max(totalPages, 1)
        };
    }
}