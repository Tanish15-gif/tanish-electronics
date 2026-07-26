namespace TanishElectronics.Api.DTOs.Auth.Custom;

public class ResetPasswordRequestDto
{
    public string ResetToken { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}