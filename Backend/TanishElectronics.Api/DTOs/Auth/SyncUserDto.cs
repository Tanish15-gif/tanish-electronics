namespace TanishElectronics.Api.DTOs.Auth;

public class SyncUserDto
{
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string? PhoneNumber { get; set; }
}