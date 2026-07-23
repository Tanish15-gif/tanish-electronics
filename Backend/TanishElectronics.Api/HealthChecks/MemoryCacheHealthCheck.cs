using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace TanishElectronics.Api.HealthChecks;

public class MemoryCacheHealthCheck : IHealthCheck
{
    private readonly IMemoryCache _memoryCache;

    public MemoryCacheHealthCheck(IMemoryCache memoryCache)
    {
        _memoryCache = memoryCache;
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default
    )
    {
        const string key = "health-check-memory-cache";
        var expectedValue = Guid.NewGuid().ToString("N");

        _memoryCache.Set(key, expectedValue, TimeSpan.FromSeconds(10));

        var exists = _memoryCache.TryGetValue(key, out string? actualValue);

        if (!exists || actualValue != expectedValue)
        {
            return Task.FromResult(
                HealthCheckResult.Unhealthy("Memory cache is not working.")
            );
        }

        return Task.FromResult(
            HealthCheckResult.Healthy("Memory cache is working.")
        );
    }
}