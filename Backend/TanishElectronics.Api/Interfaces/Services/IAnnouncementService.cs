using TanishElectronics.Api.DTOs.Admin.Announcements;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.DTOs.Public.Announcements;

namespace TanishElectronics.Api.Interfaces.Services;

public interface IAnnouncementService
{
    Task<PagedResultDto<AdminAnnouncementDto>> GetAdminAnnouncementsAsync(AdminAnnouncementQueryDto query);

    Task<AdminAnnouncementDto> CreateAnnouncementAsync(CreateAnnouncementDto dto, int? createdByAppUserId);

    Task<bool> UpdateAnnouncementAsync(int id, UpdateAnnouncementDto dto);

    Task<bool> SoftDeleteAnnouncementAsync(int id);

    Task<List<PublicAnnouncementDto>> GetPublicAnnouncementAsync(string location, string audience, int limit);
    Task<int> ExpireAnnouncementsAsync();

    Task<List<PublicAnnouncementDto>> GetCustomerAnnouncementsAsync(string location, int limit);
    Task<PublicAnnouncementDto?> GetCustomerPopupAnnouncementAsync(string location, int appUserId);

    Task<bool> MarkAnnouncementAsViewedAsync(int announcementId, int appUserId);
    Task<string> UpdateAnnouncementImageAsync(int announcementId, IFormFile image);
}