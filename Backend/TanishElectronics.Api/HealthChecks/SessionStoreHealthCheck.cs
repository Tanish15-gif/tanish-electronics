using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using TanishElectronics.Api.Data;

namespace TanishElectronics.Api.HealthChecks;

public class SessionStoreHealthCheck : IHealthCheck
{
    private readonly TanishElectronicsDbContext _dbContext;
    private readonly ILogger<SessionStoreHealthCheck> _logger;

    public SessionStoreHealthCheck
    (
        TanishElectronicsDbContext dbContext,
        ILogger<SessionStoreHealthCheck> logger
    )
    {
        _dbContext = dbContext;
        _logger = logger;
    }
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var stopWatch = Stopwatch.StartNew();

        try
        {
            var activeSessionCount = await _dbContext.UserSessions
                        .Where(session => session.RevokedAt == null)
                        .CountAsync(cancellationToken);

            stopWatch.Stop();

            var latencyMs = stopWatch.ElapsedMilliseconds;

            var data = new Dictionary<string, object>
            {
                ["latencyMs"] = latencyMs,
                ["activeSessionCount"] = activeSessionCount
            };

            if (latencyMs > 1000)
            {
                _logger.LogWarning("Session store health check degraded. Latency: {LatencyMs}ms", latencyMs);

                return HealthCheckResult.Degraded("Session store is reachable but slow.", data: data);
            }

            return HealthCheckResult.Healthy("Session store is readable and writable.", data);
        }
        catch (Exception ex)
        {
            stopWatch.Stop();

            _logger.LogError(
                ex,
                "Session store health check failed after {LatencyMs}ms",
                stopWatch.ElapsedMilliseconds
            );

            return HealthCheckResult.Unhealthy(
                "Session store is not reachable.",
                ex,
                new Dictionary<string, object>
                {
                    ["latencyMs"] = stopWatch.ElapsedMilliseconds
                }
            );
        }
    }
}