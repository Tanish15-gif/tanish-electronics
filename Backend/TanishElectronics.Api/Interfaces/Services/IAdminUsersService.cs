using TanishElectronics.Api.DTOs.Admin.Users;
using TanishElectronics.Api.DTOs.Common;

namespace TanishElectronics.Api.Interfaces.Services;

public interface IAdminUsersService
{
    Task<PagedResultDto<AdminUserListItemDto>> GetUsersAsync(AdminUsersQueryDto query);

    Task<AdminUsersSummaryDto> GetSummaryAsync();

    Task<AdminUserDetailsDto> GetUserDetailsAsync(int appUserId);

    Task SetUserActiveStatusAsync(int appUserId, bool isActive);

    Task UnlockUserAsync(int appUserId);

    Task RevokeAllUserSessionsAsync(int appUserId);
}