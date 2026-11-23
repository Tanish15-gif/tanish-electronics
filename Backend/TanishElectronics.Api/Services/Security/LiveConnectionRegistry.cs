using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.Settings;
using System.Security.Claims;

namespace TanishElectronics.Api.Services.Security;

public sealed record LiveConnection(HubCallerContext Context, int? UserId, Guid? SessionId,
    string Roles, DateTime ExpiresAt);

public sealed class LiveConnectionRegistry
{
    public ConcurrentDictionary<string, LiveConnection> Connections { get; } = new();
}

public sealed class SessionHubFilter(LiveConnectionRegistry registry, IOptions<JwtSettings> settings) : IHubFilter
{
    private async Task<LiveConnection> SnapshotAsync(HubCallerContext context, IServiceProvider services)
    {
        if (context.User?.Identity?.IsAuthenticated != true)
            return new(context, null, null, "", DateTime.UtcNow.AddMinutes(10));
        if (!int.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ||
            !Guid.TryParse(context.User.FindFirstValue("sid"), out var sessionId))
            throw new HubException("Invalid session.");
        var db = services.GetRequiredService<TanishElectronicsDbContext>();
        var session = await db.UserSessions.AsNoTracking().FirstOrDefaultAsync(s => s.UserSessionId == sessionId &&
            s.AppUserId == userId && s.RevokedAt == null && s.AppUser.IsActive && s.AppUser.DeletedAt == null &&
            s.CreatedAt > DateTime.UtcNow.AddDays(-settings.Value.AbsoluteSessionDays));
        if (session == null) throw new HubException("Your session has ended.");
        var roles = await db.AppUserRoles.Where(r => r.AppUserId == userId).Select(r => r.Role.RoleName).ToListAsync();
        var expiry = long.TryParse(context.User.FindFirstValue("exp"), out var seconds)
            ? DateTimeOffset.FromUnixTimeSeconds(seconds).UtcDateTime : DateTime.UtcNow;
        return new(context, userId, sessionId, string.Join(",", roles.Order()), expiry);
    }

    public async Task OnConnectedAsync(HubLifetimeContext context, Func<HubLifetimeContext, Task> next)
    {
        if (context.Hub is TanishElectronics.Api.Hubs.AnnouncementHub) { await next(context); return; }
        try
        {
            registry.Connections[context.Context.ConnectionId] = await SnapshotAsync(context.Context, context.ServiceProvider);
            await next(context);
        }
        catch { registry.Connections.TryRemove(context.Context.ConnectionId, out _); context.Context.Abort(); throw; }
    }

    public async ValueTask<object?> InvokeMethodAsync(HubInvocationContext context, Func<HubInvocationContext, ValueTask<object?>> next)
    {
        if (context.Hub is TanishElectronics.Api.Hubs.AnnouncementHub) return await next(context);
        var current = await SnapshotAsync(context.Context, context.ServiceProvider);
        if (registry.Connections.TryGetValue(context.Context.ConnectionId, out var original) &&
            (original.ExpiresAt <= DateTime.UtcNow || original.Roles != current.Roles))
        { context.Context.Abort(); throw new HubException("Your session has changed. Please reconnect."); }
        return await next(context);
    }

    public async Task OnDisconnectedAsync(HubLifetimeContext context, Exception? exception,
        Func<HubLifetimeContext, Exception?, Task> next)
    {
        registry.Connections.TryRemove(context.Context.ConnectionId, out _);
        await next(context, exception);
    }
}

public sealed class LiveConnectionMonitor(LiveConnectionRegistry registry, IServiceScopeFactory scopeFactory,
    IOptions<JwtSettings> settings, ILogger<LiveConnectionMonitor> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(5));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            if (registry.Connections.IsEmpty) continue;
            try
            {
                using var scope = scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<TanishElectronicsDbContext>();
                foreach (var (id, connection) in registry.Connections.ToArray())
                {
                    var active = connection.ExpiresAt > DateTime.UtcNow;
                    if (active && connection.UserId.HasValue)
                    {
                        active = await db.UserSessions.AnyAsync(s => s.UserSessionId == connection.SessionId &&
                            s.AppUserId == connection.UserId && s.RevokedAt == null && s.AppUser.IsActive &&
                            s.AppUser.DeletedAt == null && s.CreatedAt > DateTime.UtcNow.AddDays(-settings.Value.AbsoluteSessionDays), stoppingToken);
                        if (active)
                        {
                            var roles = await db.AppUserRoles.Where(r => r.AppUserId == connection.UserId)
                                .Select(r => r.Role.RoleName).ToListAsync(stoppingToken);
                            active = connection.Roles == string.Join(",", roles.Order());
                        }
                    }
                    if (!active) { connection.Context.Abort(); registry.Connections.TryRemove(id, out _); }
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Unable to verify live sessions; closing protected connections.");
                foreach (var (id, connection) in registry.Connections.ToArray())
                { connection.Context.Abort(); registry.Connections.TryRemove(id, out _); }
            }
        }
    }
}
