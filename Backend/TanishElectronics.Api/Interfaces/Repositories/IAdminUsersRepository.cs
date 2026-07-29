using TanishElectronics.Api.DTOs.Admin.Users;
using TanishElectronics.Api.DTOs.Common;

namespace TanishElectronics.Api.Interfaces.Repositories;

public interface IAdminUsersRepository
{
    Task<PagedResultDto<AdminUserListItemDto>> GetUsersAsync(AdminUsersQueryDto query);

    Task<AdminUsersSummaryDto> GetSummaryAsync();

    Task<AdminUserDetailsDto?> GetUserDetailsAsync(int appUserId);

    Task<bool> SetUserActiveStatusAsync(int appUserId, bool isActive, string? revokedByIp);

    Task<bool> UnlockUserAsync(int appUserId);

    Task<bool> RevokeAllUserSessionsAsync(int appUserId, string? revokedByIp);
}