using System.Security.Claims;
using TanishElectronics.Api.Interfaces.Common;

namespace TanishElectronics.Api.Services;

public class CurrentUserContext : ICurrentUserContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    public CurrentUserContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }
    public int UserId
    {
        get
        {
            var httpcontext = _httpContextAccessor.HttpContext;

            var userIdValue = httpcontext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdValue, out var userId)) throw new UnauthorizedAccessException("Authenticated user identifier is invalid.");

            return userId;
        }
    }

    public string? IpAddress => _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
}