using TanishElectronics.Api.DTOs.Auth;
using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Repositories;

public interface IAuthRepository
{
    Task<AppUser?> GetAppUserByClerkIdAsync(string clerkUserId);
    Task<int?> GetAppUserIdByClerkIdAsync(string clerkUserId);

    Task<int> GetRoleIdByNameAsync(string roleName);
    Task AddAppUserAsync(AppUser appUser);
    Task AddAppUserRoleAsync(AppUserRole appUserRole);
    Task<AuthUserDto?> GetAuthUserByClerkIdAsync(string clerkUserId);
    Task<AppUser?> GetAppUserByEmailAsync(string email);
    Task<bool> AppUserHasRoleAsync(int appUserId, string roleName);
    Task SaveChangesAsync();
}