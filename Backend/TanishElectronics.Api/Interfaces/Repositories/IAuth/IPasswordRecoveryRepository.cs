using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Repositories.Auth;

public interface IPasswordRecoveryRepository
{
    Task<OtpCode?> GetLatestOtpAsync(string normalizedEmail, string purpose);
    Task AddOtpAsync(OtpCode otpCode);
    Task InvalidateActiveOtpsAsync(string normalizedEmail, string purpose);
    Task<OtpCode?> GetLatestActiveOtpAsync(string normalizedEmail, string purpose);
    Task UpdateOtpAsync(OtpCode otpCode);
    Task ConsumeOtpAndCreateResetSessionAsync(OtpCode otpCode, PasswordResetSession resetSession);
    Task<PasswordResetSession?> GetPasswordResetSessionByHashAsync(string tokenHash);
    Task CompletePasswordResetAsync(AppUser user, PasswordResetSession resetSession, string? revokedByIp);
    Task CompletePasswordChangeAsync(AppUser user, string? revokedByIp);
}