using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Repositories;

public interface ICustomAuthRepository
{
    Task<AppUser?> GetUserByNormalizedEmailAsync(string normalizedEmail);

    Task<bool> EmailExistsAsync(string normalizedEmail);

    Task<AppUser> CreateUserAsync(AppUser user);

    Task AssignRoleAsync(int appUserId, string roleName);

    Task<List<string>> GetUserRolesAsync(int appUserId);

    Task AddRefreshTokenAsync(RefreshToken refreshToken);

    Task UpdateUserAsync(AppUser user);

    Task AddAuthEventAsync(UserAuthEvent authEvent);

    Task<RefreshToken?> GetRefreshTokenByHashAsync(string tokenHash);
    Task RevokeRefreshTokenAsync(RefreshToken refreshToken, string? revokedByIp, string replacedByTokenHash = null!);
}