using System.Security.Claims;

namespace TanishElectronics.Api.Helpers;

public static class RateLimitKeyHelper
{
    public static string GetUserOrIpKey(HttpContext context)
    {
        var appUserId =
            context.User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            context.User.FindFirstValue("sub");

        if (!string.IsNullOrWhiteSpace(appUserId))
        {
            return $"user:{appUserId}";
        }

        return $"ip:{context.Connection.RemoteIpAddress}";
    }
}