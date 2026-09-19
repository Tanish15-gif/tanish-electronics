using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Repositories.Auth;

public interface ICredentialAuthRepository
{
    Task<AppUser?> GetUserByNormalizedEmailAsync(string normalizedEmail);
    Task<bool> EmailExistsAsync(string normalizedEmail);
    Task<AppUser> CreateUserAsync(AppUser user);
    Task UpdateUserAsync(AppUser user);
    Task AssignRoleAsync(int appUserId, string roleName);
    Task<List<string>> GetUserRolesAsync(int appUserId);
    Task CreateCustomerProfileIfMissingAsync(AppUser appUser);
    Task AddAuthEventAsync(UserAuthEvent authEvent);
    Task<AppUser?> GetUserByIdWithExternalLoginsAsync(int appUserId);

    // Authorization support
    Task<AppUser?> GetAppUserByIdAsync(int appUserId);
    Task<bool> AppUserHasRoleAsync(int appUserId, string roleName);
}