namespace TanishElectronics.Api.DTOs.Auth;

public class AuthUserDto
{
    public int AppUserId { get; set; }
    public string ClerkUserId { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string? PhoneNumber { get; set; }

    public List<string> Roles { get; set; } = new();
    public bool IsAdmin => Roles.Contains("Owner") || Roles.Contains("Admin");
}