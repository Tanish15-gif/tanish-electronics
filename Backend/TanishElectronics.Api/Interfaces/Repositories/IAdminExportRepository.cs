using TanishElectronics.Api.DTOs.Admin.AuditLogs;
using TanishElectronics.Api.DTOs.Admin.Enquiries;
using TanishElectronics.Api.DTOs.Admin.Exports;
using TanishElectronics.Api.DTOs.Admin.ServiceRequests;

namespace TanishElectronics.Api.Interfaces.Repositories;

public interface IAdminExportRepository
{
    Task<List<AuditLogExportRowDto>> GetAuditLogsForExportAsync(AdminAuditLogQueryDto query, int maxRows);
    Task<List<ServiceRequestExportRowDto>> GetServiceRequestsForExportAsync(AdminServiceRequestQueryDto query, int maxRows);

    Task<List<EnquiryExportRowDto>> GetEnquiriesForExportAsync(AdminEnquiryQueryDto query, int maxRows);

    Task<List<ProductExportRowDto>> GetProductsForExportAsync(AdminProductExportQueryDto query, int maxRows);
    Task<List<WebsiteVisitExportRowDto>> GetWebsiteVisitsForExportAsync(int maxRows);

    Task<List<FeedbackExportRowDto>> GetFeedbacksForExportAsync(AdminFeedbackExportQueryDto query, int maxRows);

    Task<List<AnnouncementExportRowDto>> GetAnnouncementsForExportAsync(AdminAnnouncementExportQueryDto query, int maxRows);
}