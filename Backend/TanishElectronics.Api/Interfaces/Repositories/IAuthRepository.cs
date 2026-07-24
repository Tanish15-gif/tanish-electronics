using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Repositories;

public interface IAuthRepository
{
    Task<AppUser?> GetAppUserByIdAsync(int appUserId);

    Task<bool> AppUserHasRoleAsync(int appUserId, string roleName);
}