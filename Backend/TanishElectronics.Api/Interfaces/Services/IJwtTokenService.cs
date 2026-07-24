using TanishElectronics.Api.DTOs.Auth.Custom;
using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Services;

public interface IJwtTokenService
{
    AuthResponseDto GenerateAuthResponse(AppUser user, List<string> roles, string refreshToken);

    string GenerateRefreshToken();
    string HashRefreshToken(string refreshToken);
}