using TanishElectronics.Api.DTOs.Auth;

namespace TanishElectronics.Api.Interfaces.Services.AuthService;

public interface ICredentialAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto dto);
}