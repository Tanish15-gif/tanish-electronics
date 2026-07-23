using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using TanishElectronics.Api.Data;

namespace TanishElectronics.Api.HealthChecks;

public class SqlServerLatencyHealthCheck : IHealthCheck
{
    private readonly TanishElectronicsDbContext _dbContext;
    private readonly ILogger<SqlServerLatencyHealthCheck> _logger;
    public SqlServerLatencyHealthCheck(TanishElectronicsDbContext dbContext, ILogger<SqlServerLatencyHealthCheck> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var stopWatch = Stopwatch.StartNew();

        try
        {
            await _dbContext.Database.ExecuteSqlRawAsync("SELECT 1", cancellationToken);
            stopWatch.Stop();

            var latencyMs = stopWatch.ElapsedMilliseconds;

            var data = new Dictionary<string, object>
            {
                ["latencyMs"] = latencyMs
            };

            if (latencyMs > 1000)
            {
                _logger.LogWarning(
                    "SQL Server health check degraded. Latency: {LatencyMs}ms", latencyMs
                );

                return HealthCheckResult.Degraded("SQL Server is reachable but slow.", data: data);
            }
            return HealthCheckResult.Healthy("SQL Server is reachable.", data);
        }
        catch (Exception ex)
        {
            stopWatch.Stop();

            _logger.LogError(
                ex,
                "SQL Server health check failed after {LatencyMs}ms",
                stopWatch.ElapsedMilliseconds
            );

            return HealthCheckResult.Unhealthy(
                "SQL Server is not reachable.",
                ex,
                new Dictionary<string, object>
                {
                    ["latencyMs"] = stopWatch.ElapsedMilliseconds
                }
            );
        }
    }
}