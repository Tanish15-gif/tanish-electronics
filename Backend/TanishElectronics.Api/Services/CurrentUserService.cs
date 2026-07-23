using System.Security.Claims;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IAuthRepository _repository;
    public CurrentUserService(IHttpContextAccessor httpContextAccessor, IAuthRepository repository)
    {
        _httpContextAccessor = httpContextAccessor;
        _repository = repository;
    }
    public async Task<int?> GetCurrentAppUserIdAsync()
    {
        var clerkUserId = GetCurrentClerkUserId();

        if (string.IsNullOrWhiteSpace(clerkUserId))
        {
            return null;
        }
        return await _repository.GetAppUserIdByClerkIdAsync(clerkUserId);
    }

    public string? GetCurrentClerkUserId()
    {
        var user = _httpContextAccessor.HttpContext?.User;

        return user?.FindFirstValue(ClaimTypes.NameIdentifier) ??
               user?.FindFirstValue("sub");
    }

    public async Task<int> GetRequiredCurrentAppUserIdAsync()
    {
        var appUserId = await GetCurrentAppUserIdAsync();

        if (appUserId == null) throw new UnauthorizedAccessException("User not found.");

        return appUserId.Value;
    }
}