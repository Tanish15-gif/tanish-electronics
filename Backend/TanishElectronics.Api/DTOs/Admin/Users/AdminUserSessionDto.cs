namespace TanishElectronics.Api.DTOs.Admin.Users;

public class AdminUserSessionDto
{
    public Guid UserSessionId { get; set; }

    public string DeviceType { get; set; } = string.Empty;

    public string DeviceName { get; set; } = string.Empty;

    public string BrowserName { get; set; } = string.Empty;

    public string? BrowserVersion { get; set; }

    public string OperatingSystem { get; set; } = string.Empty;

    public string? IpAddress { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime LastSeenAt { get; set; }
}