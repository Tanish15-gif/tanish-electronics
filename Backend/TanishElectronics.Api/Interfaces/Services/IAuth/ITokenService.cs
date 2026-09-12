using TanishElectronics.Api.DTOs.Auth;
using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Services.AuthService;

public interface ITokenService
{
    Task<AuthResponseDto> RefreshAsync(RefreshTokenRequestDto dto);
    Task LogoutAsync(LogoutRequestDto dto);
    Task SaveRefreshTokenAsync(int appUserId, Guid userSessionId, string refreshToken);
    Task<UserSession> CreateUserSessionAsync(int appUserId);
}