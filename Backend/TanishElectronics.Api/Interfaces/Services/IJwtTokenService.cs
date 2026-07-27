using TanishElectronics.Api.DTOs.Auth;
using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Services;

public interface IJwtTokenService
{
    AuthResponseDto GenerateAuthResponse(AppUser user, List<string> roles, string refreshToken, Guid userSessionId);

    string GenerateRefreshToken();
    string HashRefreshToken(string refreshToken);
}