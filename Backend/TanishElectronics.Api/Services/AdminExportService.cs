using TanishElectronics.Api.DTOs.Admin.AuditLogs;
using TanishElectronics.Api.DTOs.Admin.Enquiries;
using TanishElectronics.Api.DTOs.Admin.Exports;
using TanishElectronics.Api.DTOs.Admin.ServiceRequests;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.Helpers;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class AdminExportService : IAdminExportService
{
    private const int MaxExportRows = 5000;

    private readonly IAdminExportRepository _exportRepository;
    private readonly IAuditLogService _auditLogService;
    public AdminExportService(IAdminExportRepository exportRepository, IAuditLogService auditLogService)
    {
        _exportRepository = exportRepository;
        _auditLogService = auditLogService;
    }
    public async Task<CsvExportResultDto> ExportAuditLogsAsync(AdminAuditLogQueryDto query, int adminAppUserId)
    {
        var rows = await _exportRepository.GetAuditLogsForExportAsync(query, MaxExportRows);

        var csvRows = rows.Select(row => new[]
        {
            row.AuditLogId.ToString(),
            row.Action,
            row.EntityName,
            row.EntityId?.ToString() ?? "",
            row.Description ?? "",
            row.AdminName ?? "System",
            row.AdminEmail ?? "",
            row.IpAddress ?? "",
            row.UserAgent ?? "",
            row.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
        });

        var content = CsvExportHelper.BuildCsv(
            new[]
            {
                "AuditLogId",
                "Action",
                "EntityName",
                "EntityId",
                "Description",
                "AdminName",
                "AdminEmail",
                "IpAddress",
                "UserAgent",
                "CreatedAt"
            },
            csvRows
        );

        await _auditLogService.LogAsync(
            adminAppUserId,
            "ExportAuditLogs",
            "AuditLogs",
            null,
            $"Audit logs CSV exported. Rows: {rows.Count}."
        );

        return new CsvExportResultDto
        {
            FileName = $"audit-logs-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv",
            Content = content
        };
    }

    public async Task<CsvExportResultDto> ExportServiceRequestsAsync(AdminServiceRequestQueryDto query, int adminAppUserId)
    {
        var rows = await _exportRepository.GetServiceRequestsForExportAsync(query, MaxExportRows);

        var csvRows = rows.Select(row => new[]
        {
            row.ServiceRequestId.ToString(),
            row.RequestNumber,
            row.CustomerName,
            row.PhoneNumber,
            row.ServiceCategory,
            row.CurrentStatus,
            row.ServiceType,
            row.PreferredDate?.ToString("yyyy-MM-dd") ?? "",
            row.PreferredTimeSlot ?? "",
            row.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
        });

        var content = CsvExportHelper.BuildCsv(
            new[]
            {
                "ServiceRequestId",
                "RequestNumber",
                "CustomerName",
                "PhoneNumber",
                "ServiceCategory",
                "CurrentStatus",
                "ServiceType",
                "PreferredDate",
                "PreferredTimeSlot",
                "CreatedAt"
            },
            csvRows
        );

        await _auditLogService.LogAsync(
            adminAppUserId,
            "ExportServiceRequests",
            "ServiceRequests",
            null,
            $"Service requests CSV exported. Rows: {rows.Count}."
        );

        return new CsvExportResultDto
        {
            FileName = $"service-requests-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv",
            Content = content
        };
    }

    public async Task<CsvExportResultDto> ExportEnquiryRequestsAsync(AdminEnquiryQueryDto query, int adminAppUserId)
    {
        var rows = await _exportRepository.GetEnquiriesForExportAsync(
            query,
            MaxExportRows
        );

        var csvRows = rows.Select(row => new[]
        {
            row.EnquiryId.ToString(),
            row.CustomerName,
            row.PhoneNumber,
            row.Email,
            row.ProductName,
            row.StatusName,
            row.Message,
            row.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
        });

        var content = CsvExportHelper.BuildCsv(
            new[]
            {
                "EnquiryId",
                "CustomerName",
                "PhoneNumber",
                "Email",
                "ProductName",
                "StatusName",
                "Message",
                "CreatedAt"
            },
            csvRows
        );

        await _auditLogService.LogAsync(
            adminAppUserId,
            "ExportEnquiryRequests",
            "EnquiryRequests",
            null,
            $"Enquiry requests CSV exported. Rows: {rows.Count}."
        );

        return new CsvExportResultDto
        {
            FileName = $"enquiry-requests-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv",
            Content = content
        };
    }

    public async Task<CsvExportResultDto> ExportProductsAsync(AdminProductExportQueryDto query, int adminAppUserId)
    {
        var rows = await _exportRepository.GetProductsForExportAsync(query, MaxExportRows);

        var csvRows = rows.Select(row => new[]
        {
            row.ProductId.ToString(),
            row.ProductName,
            row.Brand,
            row.ModelName,
            row.CategoryName,
            row.ConditionName,
            row.Price.ToString("F2"),
            row.StockQuantity.ToString(),
            row.IsAvailable.ToString(),
            row.IsFeatured.ToString(),
            row.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
        });

        var content = CsvExportHelper.BuildCsv(
            new[]
            {
                "ProductId",
                "ProductName",
                "Brand",
                "ModelName",
                "CategoryName",
                "ConditionName",
                "Price",
                "StockQuantity",
                "IsAvailable",
                "IsFeatured",
                "CreatedAt"
            },
            csvRows
        );

        await _auditLogService.LogAsync(
            adminAppUserId,
            "ExportProducts",
            "Products",
            null,
            $"Products CSV exported. Rows: {rows.Count}."
        );

        return new CsvExportResultDto
        {
            FileName = $"products-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv",
            Content = content
        };
    }

    public async Task<CsvExportResultDto> ExportWebsiteVisitAsync(int adminAppUserId)
    {
        var rows = await _exportRepository.GetWebsiteVisitsForExportAsync(MaxExportRows);

        var csvRows = rows.Select(row => new[]
        {
            row.WebsiteVisitId.ToString(),
            row.VisitorId?.ToString() ?? "",
            row.AppUserId?.ToString() ?? "",
            row.Path,
            row.Referrer ?? "",
            row.IpAddress ?? "",
            row.UserAgent ?? "",
            row.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
        });

        var content = CsvExportHelper.BuildCsv(
            new[]
            {
                "WebsiteVisitId",
                "VisitorId",
                "AppUserId",
                "Path",
                "Referrer",
                "IpAddress",
                "UserAgent",
                "CreatedAt"
            },
            csvRows
        );
        await _auditLogService.LogAsync(
            adminAppUserId,
            "ExportWebsiteVisits",
            "WebsiteVisits",
            null,
            $"Website visits CSV exported. Rows: {rows.Count}."
        );

        return new CsvExportResultDto
        {
            FileName = $"website-visits-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv",
            Content = content
        };
    }

    public async Task<CsvExportResultDto> ExportFeedbackAsync(AdminFeedbackExportQueryDto query, int adminAppUserId)
    {
        var rows = await _exportRepository.GetFeedbacksForExportAsync(query, MaxExportRows);

        var csvRows = rows.Select(row => new[]
        {
            row.CustomerRepairFeedbackId.ToString(),
            row.ServiceRequestId.ToString(),
            row.RequestNumber,
            row.CustomerId.ToString(),
            row.CustomerName,
            row.PhoneNumber,
            row.Rating.ToString(),
            row.Comment ?? "",
            row.IsPublic.ToString(),
            row.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
            row.UpdatedAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? ""
        });

        var content = CsvExportHelper.BuildCsv(
            new[]
            {
            "CustomerRepairFeedbackId",
            "ServiceRequestId",
            "RequestNumber",
            "CustomerId",
            "CustomerName",
            "PhoneNumber",
            "Rating",
            "Comment",
            "IsPublic",
            "CreatedAt",
            "UpdatedAt"
            },
            csvRows
        );

        await _auditLogService.LogAsync(
            adminAppUserId,
            "ExportFeedbacks",
            "CustomerRepairFeedbacks",
            null,
            $"Feedbacks CSV exported. Rows: {rows.Count}."
        );

        return new CsvExportResultDto
        {
            FileName = $"feedbacks-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv",
            Content = content
        };
    }

    public async Task<CsvExportResultDto> ExportAnnouncementAsync(AdminAnnouncementExportQueryDto query, int adminAppUserId)
    {
        var rows = await _exportRepository.GetAnnouncementsForExportAsync(query, MaxExportRows);

        var csvRows = rows.Select(row => new[]
        {
            row.AnnouncementId.ToString(),
            row.Title,
            row.Message,
            row.AnnouncementType,
            row.Audience,
            row.DisplayLocation,
            row.ImageUrl ?? "",
            row.ButtonText ?? "",
            row.ButtonLink ?? "",
            row.StartAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "",
            row.EndAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? "",
            row.Priority.ToString(),
            row.IsActive.ToString(),
            row.ShowOnce.ToString(),
            row.CreatedByAppUserId?.ToString() ?? "",
            row.CreatedByName ?? "",
            row.CreatedByEmail ?? "",
            row.TotalViews.ToString(),
            row.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
            row.UpdatedAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? ""
        });

        var content = CsvExportHelper.BuildCsv(
            new[]
            {
                "AnnouncementId",
                "Title",
                "Message",
                "AnnouncementType",
                "Audience",
                "DisplayLocation",
                "ImageUrl",
                "ButtonText",
                "ButtonLink",
                "StartAt",
                "EndAt",
                "Priority",
                "IsActive",
                "ShowOnce",
                "CreatedByAppUserId",
                "CreatedByName",
                "CreatedByEmail",
                "TotalViews",
                "CreatedAt",
                "UpdatedAt"
            },
            csvRows
        );
        await _auditLogService.LogAsync(
            adminAppUserId,
            "ExportAnnouncements",
            "Announcements",
            null,
            $"Announcements CSV exported. Rows: {rows.Count}."
        );

        return new CsvExportResultDto
        {
            FileName = $"announcements-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv",
            Content = content
        };
    }
}
