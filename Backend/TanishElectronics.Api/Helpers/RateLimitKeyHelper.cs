using System.Security.Claims;

namespace TanishElectronics.Api.Helpers;

public static class RateLimitKeyHelper
{
    public static string GetClientKey(HttpContext context)
    {
        var clerkUserId = context.User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            context.User.FindFirstValue("sub");

        if (!string.IsNullOrWhiteSpace(clerkUserId)) return $"user:{clerkUserId}";

        var forwardFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(forwardFor))
        {
            var firstIp = forwardFor.Split(",")[0].Trim();

            if (!string.IsNullOrWhiteSpace(firstIp))
            {
                return $"ip:{firstIp}";
            }
        }
        var remoteIp = context.Connection.RemoteIpAddress?.ToString();

        return $"ip:{remoteIp ?? "unknown"}";
    }
}