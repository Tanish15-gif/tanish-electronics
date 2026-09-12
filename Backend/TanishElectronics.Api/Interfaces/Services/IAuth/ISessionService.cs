using TanishElectronics.Api.DTOs.Auth;
using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Services.AuthService;

public interface ISessionService
{
    Task SignOutOtherSessionsAsync(SignOutOtherSessionsRequestDto dto);
    Task SignOutAllSessionsAsync();
    Task<List<ActiveSessionDto>> GetActiveSessionsAsync();
    Task RevokeSessionAsync(Guid userSessionId);
    Task<UserSession> CreateUserSessionAsync(int appUserId);
}