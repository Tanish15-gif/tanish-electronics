using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Admin.AuditLogs;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Authorize(Policy = AppPolicies.AdminOnly)]
[EnableRateLimiting(RateLimitPolicies.AdminAction)]
[Route("admin/audit-logs")]
public class AdminAuditLogsController : ControllerBase
{
    private readonly IAuditLogService _logService;
    public AdminAuditLogsController(IAuditLogService logService)
    {
        _logService = logService;
    }
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] AdminAuditLogQueryDto query)
    {
        var auditLogs = await _logService.GetAdminAuditLogsAsync(query);
        return Ok(auditLogs);
    }
}