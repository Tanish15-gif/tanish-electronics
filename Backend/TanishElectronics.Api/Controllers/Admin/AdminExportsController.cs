using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Admin.AuditLogs;
using TanishElectronics.Api.DTOs.Admin.Enquiries;
using TanishElectronics.Api.DTOs.Admin.Exports;
using TanishElectronics.Api.DTOs.Admin.ServiceRequests;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Authorize(Policy = AppPolicies.AdminOnly)]
[EnableRateLimiting(RateLimitPolicies.AdminAction)]
[Route("admin/exports")]
public class AdminExportsController : ControllerBase
{
    private readonly IAdminExportService _exportService;
    private readonly ICurrentUserService _userService;
    public AdminExportsController(IAdminExportService exportService, ICurrentUserService userService)
    {
        _exportService = exportService;
        _userService = userService;
    }
    [HttpGet("audit-logs")]
    public async Task<IActionResult> ExportAuditLogs([FromQuery] AdminAuditLogQueryDto query)
    {
        var adminAppUserId = await _userService.GetRequiredCurrentAppUserIdAsync();

        var exportFile = await _exportService.ExportAuditLogsAsync(query, adminAppUserId);

        return File(exportFile.Content, exportFile.ContentType, exportFile.FileName);
    }
    [HttpGet("service-requests")]
    public async Task<IActionResult> ExportServiceRequests([FromQuery] AdminServiceRequestQueryDto query)
    {
        var adminAppUserId = await _userService.GetRequiredCurrentAppUserIdAsync();

        var exportFile = await _exportService.ExportServiceRequestsAsync(query, adminAppUserId);

        return File(
            exportFile.Content,
            exportFile.ContentType,
            exportFile.FileName
        );
    }
    [HttpGet("enquiries")]
    public async Task<IActionResult> ExportEnquiryRequests([FromQuery] AdminEnquiryQueryDto query)
    {
        var adminAppUserId = await _userService.GetRequiredCurrentAppUserIdAsync();

        var exportFile = await _exportService.ExportEnquiryRequestsAsync(query, adminAppUserId);

        return File(
            exportFile.Content,
            exportFile.ContentType,
            exportFile.FileName
        );
    }
    [HttpGet("products")]
    public async Task<IActionResult> ExportProducts([FromQuery] AdminProductExportQueryDto query)
    {
        var adminAppUserId = await _userService.GetRequiredCurrentAppUserIdAsync();

        var exportFile = await _exportService.ExportProductsAsync(query, adminAppUserId);

        return File(
            exportFile.Content,
            exportFile.ContentType,
            exportFile.FileName
        );
    }
    [HttpGet("website-visits")]
    public async Task<IActionResult> ExportWebsiteVisits()
    {
        var adminAppUserId = await _userService.GetRequiredCurrentAppUserIdAsync();

        var exportFile = await _exportService.ExportWebsiteVisitAsync(adminAppUserId);

        return File(
            exportFile.Content,
            exportFile.ContentType,
            exportFile.FileName
        );
    }
    [HttpGet("feedbacks")]
    public async Task<IActionResult> ExportFeedbacks([FromQuery] AdminFeedbackExportQueryDto query)
    {
        var adminAppUserId = await _userService.GetRequiredCurrentAppUserIdAsync();

        var exportFile = await _exportService.ExportFeedbackAsync(query, adminAppUserId);

        return File(
            exportFile.Content,
            exportFile.ContentType,
            exportFile.FileName
        );
    }
    [HttpGet("announcements")]
    public async Task<IActionResult> ExportAnnouncements([FromQuery] AdminAnnouncementExportQueryDto query)
    {
        var adminAppUserId = await _userService.GetRequiredCurrentAppUserIdAsync();

        var exportFile = await _exportService.ExportAnnouncementAsync(query, adminAppUserId);

        return File(
            exportFile.Content,
            exportFile.ContentType,
            exportFile.FileName
        );
    }
}