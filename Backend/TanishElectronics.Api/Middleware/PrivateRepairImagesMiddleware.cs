using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.Services.Security;

namespace TanishElectronics.Api.Middleware;

// Runs after authentication and before static files. This also protects existing uploads.
public sealed class PrivateRepairImagesMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, RepairAccessService access, TanishElectronicsDbContext db,
        IWebHostEnvironment environment)
    {
        if (!context.Request.Path.StartsWithSegments("/uploads/service-requests", out var remaining))
        { await next(context); return; }

        var parts = remaining.Value?.Trim('/').Split('/') ?? [];
        if (parts.Length != 2 || !int.TryParse(parts[0], out var repairId) ||
            parts[1] != Path.GetFileName(parts[1]) || parts[1].Contains('\\'))
        { context.Response.StatusCode = 404; return; }
        if (!access.HasImageToken(repairId, parts[1], context.Request.Query["token"]) && !await access.CanAccessAsync(repairId))
        { context.Response.StatusCode = context.User.Identity?.IsAuthenticated == true ? 403 : 401; return; }
        var canonical = $"/uploads/service-requests/{repairId}/{parts[1]}";
        if (!await db.ServiceRequestImages.AnyAsync(i => i.ServiceRequestId == repairId && i.ImageUrl == canonical && i.ServiceRequest.DeletedAt == null))
        { context.Response.StatusCode = 404; return; }
        var privatePath = Path.Combine(environment.ContentRootPath, "App_Data", "repair-images", repairId.ToString(), parts[1]);
        var legacyPath = Path.Combine(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"), "uploads", "service-requests", repairId.ToString(), parts[1]);
        var path = File.Exists(privatePath) ? privatePath : legacyPath;
        if (!File.Exists(path)) { context.Response.StatusCode = 404; return; }
        context.Response.Headers.CacheControl = "private, no-store";
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["Referrer-Policy"] = "no-referrer";
        context.Response.ContentType = Path.GetExtension(path).ToLowerInvariant() switch
        { ".png" => "image/png", ".webp" => "image/webp", _ => "image/jpeg" };
        await context.Response.SendFileAsync(path, context.RequestAborted);
    }
}
