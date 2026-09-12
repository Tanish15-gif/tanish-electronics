using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Services.Helpers;

public static class AuthHelpers
{
    public static string NormalizeEmail(string email)
    {
        return email.Trim().ToUpperInvariant();
    }
    public static void EnsureUserIsActive(AppUser appUser)
    {
        if (!appUser.IsActive || appUser.DeletedAt == null) throw new UnauthorizedAccessException("Account is Inactive");
    }
}