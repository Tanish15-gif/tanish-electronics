using TanishElectronics.Api.DTOs.Auth;

namespace TanishElectronics.Api.Interfaces.Services.AuthService;

public interface IGoogleAuthService
{
    Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginRequestDto dto);
    Task<GooglePasswordReauthResponseDto> ReauthenticateGoogleForPasswordAsync(GooglePasswordReauthRequestDto dto);
}