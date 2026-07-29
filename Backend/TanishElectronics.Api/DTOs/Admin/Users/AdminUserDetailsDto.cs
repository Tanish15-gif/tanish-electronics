namespace TanishElectronics.Api.DTOs.Admin.Users;

public class AdminUserDetailsDto
{
    public int AppUserId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? PhoneNumber { get; set; }

    public string? ProfileImageUrl { get; set; }

    public List<string> Roles { get; set; } = [];

    public List<string> ConnectedProviders { get; set; } = [];

    public bool HasPassword { get; set; }

    public bool EmailConfirmed { get; set; }

    public bool IsActive { get; set; }

    public bool IsLocked { get; set; }

    public int AccessFailedCount { get; set; }

    public DateTime? LockoutEndAt { get; set; }

    public int ActiveSessionCount { get; set; }

    public DateTime? PasswordUpdatedAt { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public DateTime? LastSeenAt { get; set; }

    public DateTime? LastLogoutAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public List<AdminUserSessionDto> ActiveSessions { get; set; } = [];
}