namespace TanishElectronics.Api.DTOs.Auth.Custom;

public class AuthUserResponseDto
{
    public int AppUserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? PhoneNumber { get; set; }

    public bool EmailConfirmed { get; set; }

    public List<string> Roles { get; set; } = new();
}