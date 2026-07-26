using TanishElectronics.Api.DTOs.Auth.Custom;

namespace TanishElectronics.Api.Interfaces.Services;

public interface ICustomAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto);

    Task<AuthResponseDto> LoginAsync(LoginRequestDto dto);

    Task<AuthResponseDto> RefreshAsync(RefreshTokenRequestDto dto);

    Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginRequestDto dto);

    Task LogoutAsync(LogoutRequestDto dto);

    Task RequestForgotPasswordOtpAsync(ForgotPasswordRequestDto dto);

    Task<VerifyForgotPasswordOtpResponseDto> VerifyForgotPasswordOtpAsync(VerifyForgotPasswordOtpRequestDto dto);

    Task ResetPasswordAsync(ResetPasswordRequestDto dto);
}