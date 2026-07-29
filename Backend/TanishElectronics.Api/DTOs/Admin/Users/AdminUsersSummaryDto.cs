namespace TanishElectronics.Api.DTOs.Admin.Users;

public class AdminUsersSummaryDto
{
    public int TotalUsers { get; set; }

    public int ActiveUsers { get; set; }

    public int InactiveUsers { get; set; }

    public int LockedUsers { get; set; }

    public int GoogleUsers { get; set; }

    public int PasswordUsers { get; set; }

    public int ActiveSessions { get; set; }
}