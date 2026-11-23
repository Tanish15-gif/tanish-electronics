using System.Threading.RateLimiting;
using System.Text.Json;

namespace TanishElectronics.Api.Middleware;

public sealed class AuthAbuseLimitMiddleware : IDisposable
{
    private readonly RequestDelegate _next;
    private readonly PartitionedRateLimiter<string> _limiter = PartitionedRateLimiter.Create<string, string>(key =>
        RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        { PermitLimit = key.StartsWith("account:") ? 15 : 60, Window = TimeSpan.FromMinutes(5), QueueLimit = 0, AutoReplenishment = true }));
    public AuthAbuseLimitMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments("/auth/custom") && !context.Request.Path.StartsWithSegments("/hubs") &&
            !context.Request.Path.StartsWithSegments("/ServiceRequests/track"))
        { await _next(context); return; }
        using var ipLease = await _limiter.AcquireAsync("ip:" + context.Connection.RemoteIpAddress, 1, context.RequestAborted);
        if (!ipLease.IsAcquired) { await RejectAsync(context); return; }
        if (context.Request.Path.StartsWithSegments("/auth/custom") && HttpMethods.IsPost(context.Request.Method) &&
            context.Request.ContentType?.StartsWith("application/json", StringComparison.OrdinalIgnoreCase) == true)
        {
            context.Request.EnableBuffering();
            string? email = null;
            try
            {
                // Limit pre-auth inspection; MVC still performs full request validation.
                var bytes = new byte[16_385];
                var count = await context.Request.Body.ReadAtLeastAsync(bytes, bytes.Length, false, context.RequestAborted);
                if (count > 16_384) { context.Response.StatusCode = 413; return; }
                using var json = JsonDocument.Parse(bytes.AsMemory(0, count));
                if (json.RootElement.ValueKind == JsonValueKind.Object)
                {
                    // Match MVC's case-insensitive binding and last matching property behavior.
                    foreach (var property in json.RootElement.EnumerateObject())
                        if (property.Name.Equals("email", StringComparison.OrdinalIgnoreCase))
                            email = property.Value.ValueKind == JsonValueKind.String ? property.Value.GetString()?.Trim().ToUpperInvariant() : null;
                }
            }
            catch (JsonException) { }
            finally { context.Request.Body.Position = 0; }
            if (!string.IsNullOrWhiteSpace(email))
            {
                using var accountLease = await _limiter.AcquireAsync("account:" + email, 1, context.RequestAborted);
                if (!accountLease.IsAcquired) { await RejectAsync(context); return; }
            }
        }
        await _next(context);
    }

    private static async Task RejectAsync(HttpContext context)
    {
        context.Response.StatusCode = 429;
        context.Response.Headers.RetryAfter = "300";
        await context.Response.WriteAsJsonAsync(new { message = "Too many attempts. Please wait and try again." });
    }
    public void Dispose() => _limiter.Dispose();
}
