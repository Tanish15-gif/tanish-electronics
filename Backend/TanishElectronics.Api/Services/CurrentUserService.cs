using System.Security.Claims;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Task<int?> GetCurrentAppUserIdAsync()
    {
        var user = _httpContextAccessor.HttpContext?.User;

        if (user == null || user.Identity?.IsAuthenticated != true)
        {
            return Task.FromResult<int?>(null);
        }

        var appUserIdValue =
            user.FindFirstValue(ClaimTypes.NameIdentifier) ??
            user.FindFirstValue("sub");

        if (!int.TryParse(appUserIdValue, out var appUserId))
        {
            return Task.FromResult<int?>(null);
        }

        return Task.FromResult<int?>(appUserId);
    }

    public async Task<int> GetRequiredCurrentAppUserIdAsync()
    {
        var appUserId = await GetCurrentAppUserIdAsync();

        if (appUserId == null)
        {
            throw new UnauthorizedAccessException("User not found.");
        }

        return appUserId.Value;
    }
}