namespace TanishElectronics.Api.DTOs.Auth.Custom;

public class VerifyForgotPasswordOtpRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}