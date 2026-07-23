using TanishElectronics.Api.DTOs.Admin.Announcements;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.DTOs.Public.Announcements;

namespace TanishElectronics.Api.Interfaces.Repositories;

public interface IAnnouncementRepository
{
    Task<PagedResultDto<AdminAnnouncementDto>> GetAdminAnnouncementsAsync(AdminAnnouncementQueryDto query);

    Task<AdminAnnouncementDto> CreateAnnouncementAsync(CreateAnnouncementDto dto, int? createdByAppUserId);

    Task<bool> UpdateAnnouncementAsync(int id, UpdateAnnouncementDto dto);

    Task<bool> SoftDeleteAnnouncementAsync(int id);

    Task<List<PublicAnnouncementDto>> GetActivePublicAnnouncementsAsync(string location);

    Task<int> DeactivateExpiredAnnouncementsAsync(DateTime now);
    Task<List<PublicAnnouncementDto>> GetActiveCustomerAnnouncementsAsync(string location, int limit);

    Task<PublicAnnouncementDto?> GetUnviewedCustomerPopupAnnouncementAsync(string location, int appUserId);
    Task<bool> MarkAnnouncementAsViewedAsync(int announcementId, int appUserId);

    Task<bool> UpdateAnnouncementImageAsync(int announcementId, string imageUrl);
}