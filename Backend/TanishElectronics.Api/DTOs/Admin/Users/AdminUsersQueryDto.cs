namespace TanishElectronics.Api.DTOs.Admin.Users;

public class AdminUsersQueryDto
{
    public string? Search { get; set; }

    public string? Role { get; set; }

    public string? Status { get; set; }

    public string? SignInMethod { get; set; }

    public bool? EmailConfirmed { get; set; }

    public string SortBy { get; set; } = "newest";

    public string SortDirection { get; set; } = "desc";

    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 10;
}