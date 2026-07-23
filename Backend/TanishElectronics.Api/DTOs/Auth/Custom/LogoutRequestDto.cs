namespace TanishElectronics.Api.DTOs.Auth.Custom;

public class LogoutRequestDto
{
    public string RefreshToken { get; set; } = string.Empty;
}