using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Repositories.Auth;

public interface ISessionRepository
{
    Task<int> GetActiveSessionCountAsync(int appUserId);
    Task RevokeOtherSessionsAsync(int appUserId, Guid currentSessionId, string? revokedByIp);
    Task RevokeAllRefreshTokensAsync(int appUserId, string? revokedByIp);
    Task<UserSession> AddUserSessionAsync(UserSession userSession);
    Task TouchUserSessionAsync(Guid userSessionId, string? ipAddress);
    Task<int> GetActiveUserSessionCountAsync(int appUserId);
    Task<List<UserSession>> GetActiveUserSessionsAsync(int appUserId);
    Task<bool> RevokeUserSessionAsync(int appUserId, Guid userSessionId, string? revokedByIp);
}