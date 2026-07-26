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

    Task CreateCustomerProfileIfMissingAsync(AppUser appUser);

    Task<ExternalLogin?> GetExternalLoginAsync(string provider, string providerUserId);

    Task AddExternalLoginAsync(ExternalLogin externalLogin);

    Task<OtpCode?> GetLatestOtpAsync(string normalizedEmail, string purpose);

    Task AddOtpAsync(OtpCode otpCode);
    Task InvalidateActiveOtpsAsync(string normalizedEmail, string purpose);

    Task<OtpCode?> GetLatestActiveOtpAsync(string normalizedEmail, string purpose);

    Task UpdateOtpAsync(OtpCode otpCode);

    Task ConsumeOtpAndCreateResetSessionAsync(OtpCode otpCode, PasswordResetSession resetSession);
    Task<PasswordResetSession?> GetPasswordResetSessionByHashAsync(string tokenRefresh);

    Task CompletePasswordResetAsync(AppUser user, PasswordResetSession resetSession, string? revokedByIp);
}