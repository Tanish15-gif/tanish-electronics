using System.Security.Cryptography;
using Microsoft.Extensions.Caching.Memory;

namespace TanishElectronics.Api.Middleware;

public sealed class SubmissionIdempotencyStore : IDisposable
{
    private readonly MemoryCache _cache = new(new MemoryCacheOptions { SizeLimit = 1000 });
    private readonly object _sync = new();
    public Entry? Get(string key)
    {
        lock (_sync)
        {
            if (_cache.TryGetValue(key, out Entry? existing)) return existing!;
            if (_cache.Count >= 1000) return null;
            var entry = new Entry();
            _cache.Set(key, entry, new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10), Size = 1 });
            return entry;
        }
    }
    public void Dispose() => _cache.Dispose();
    public sealed class Entry
    {
        public SemaphoreSlim Gate { get; } = new(1, 1);
        public string? RequestHash { get; set; }
        public byte[]? Response { get; set; }
        public string? ContentType { get; set; }
        public int StatusCode { get; set; }
    }
}

public sealed class SubmissionIdempotencyMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, SubmissionIdempotencyStore store)
    {
        var request = context.Request;
        if (!HttpMethods.IsPost(request.Method) ||
            (request.Path != "/ServiceRequests" && request.Path != "/Enquiries") ||
            !request.Headers.TryGetValue("Idempotency-Key", out var key))
        { await next(context); return; }
        if (!Guid.TryParse(key, out var id))
        { context.Response.StatusCode = 400; await context.Response.WriteAsJsonAsync(new { message = "Invalid submission identifier." }); return; }
        request.EnableBuffering();
        var buffer = new byte[32_769];
        var count = await request.Body.ReadAtLeastAsync(buffer, buffer.Length, false, context.RequestAborted);
        request.Body.Position = 0;
        if (count > 32_768) { context.Response.StatusCode = 413; return; }
        var hash = Convert.ToHexString(SHA256.HashData(buffer.AsSpan(0, count)));
        var actor = context.User.Identity?.IsAuthenticated == true ? "user:" + context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value : "ip:" + context.Connection.RemoteIpAddress;
        var entry = store.Get(actor + ":" + request.Path + ":" + id);
        if (entry == null)
        { context.Response.StatusCode = 503; await context.Response.WriteAsJsonAsync(new { message = "Submission retry protection is temporarily full. Please try again later." }); return; }
        await entry.Gate.WaitAsync(context.RequestAborted);
        try
        {
            if (entry.RequestHash != null && entry.RequestHash != hash)
            { context.Response.StatusCode = 409; await context.Response.WriteAsJsonAsync(new { message = "This submission identifier was already used for different details." }); return; }
            if (entry.Response != null)
            {
                context.Response.StatusCode = entry.StatusCode;
                context.Response.ContentType = entry.ContentType;
                await context.Response.Body.WriteAsync(entry.Response, context.RequestAborted);
                return;
            }
            entry.RequestHash = hash;
            var originalBody = context.Response.Body;
            using var captured = new MemoryStream();
            context.Response.Body = captured;
            try { await next(context); }
            finally { context.Response.Body = originalBody; }
            var response = captured.ToArray();
            if (context.Response.StatusCode is >= 200 and < 300)
            { entry.Response = response; entry.ContentType = context.Response.ContentType; entry.StatusCode = context.Response.StatusCode; }
            await originalBody.WriteAsync(response, context.RequestAborted);
        }
        finally { entry.Gate.Release(); }
    }
}
