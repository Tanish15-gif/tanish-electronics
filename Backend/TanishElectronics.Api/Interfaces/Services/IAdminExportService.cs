using TanishElectronics.Api.DTOs.Admin.AuditLogs;
using TanishElectronics.Api.DTOs.Admin.Enquiries;
using TanishElectronics.Api.DTOs.Admin.Exports;
using TanishElectronics.Api.DTOs.Admin.ServiceRequests;
using TanishElectronics.Api.DTOs.Common;

namespace TanishElectronics.Api.Interfaces.Services;

public interface IAdminExportService
{
    Task<CsvExportResultDto> ExportAuditLogsAsync(AdminAuditLogQueryDto query, int adminAppUserId);

    Task<CsvExportResultDto> ExportServiceRequestsAsync(AdminServiceRequestQueryDto query, int adminAppUserId);

    Task<CsvExportResultDto> ExportEnquiryRequestsAsync(AdminEnquiryQueryDto query, int adminAppUserId);
    Task<CsvExportResultDto> ExportProductsAsync(AdminProductExportQueryDto query, int adminAppUserId);

    Task<CsvExportResultDto> ExportWebsiteVisitAsync(int adminAppUserId);

    Task<CsvExportResultDto> ExportFeedbackAsync(AdminFeedbackExportQueryDto query, int adminAppUserId);
    Task<CsvExportResultDto> ExportAnnouncementAsync(AdminAnnouncementExportQueryDto query, int adminAppUserId);
}