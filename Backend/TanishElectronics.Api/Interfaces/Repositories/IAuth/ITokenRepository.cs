using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Repositories.Auth;

public interface ITokenRepository
{
    Task AddRefreshTokenAsync(RefreshToken refreshToken);
    Task<bool> RotateRefreshTokenAsync(RefreshToken oldToken, RefreshToken replacement, string? revokedByIp);
    Task<RefreshToken?> GetRefreshTokenByHashAsync(string tokenHash);
    Task RevokeRefreshTokenAsync(RefreshToken refreshToken, string? revokedByIp, string replacedByTokenHash = null!);
}
