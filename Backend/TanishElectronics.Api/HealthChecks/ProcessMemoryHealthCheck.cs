using System.Diagnostics;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace TanishElectronics.Api.HealthChecks;

public class ProcessMemoryHealthCheck : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var process = Process.GetCurrentProcess();
            var workingSetMb = Math.Round(process.WorkingSet64 / (1024.0 * 1024.0), 2);
            var privateMemoryMb = Math.Round(process.PrivateMemorySize64 / (1024.0 * 1024.0), 2);
            var gcAllocatedMb = Math.Round(GC.GetTotalMemory(false) / (1024.0 * 1024.0), 2);
            var threadCount = process.Threads.Count;

            var data = new Dictionary<string, object>
            {
                ["workingSetMb"] = workingSetMb,
                ["privateMemoryMb"] = privateMemoryMb,
                ["gcAllocatedMb"] = gcAllocatedMb,
                ["threadCount"] = threadCount
            };

            if (workingSetMb > 1500)
            {
                return Task.FromResult(
                    HealthCheckResult.Degraded($"High process memory consumption: {workingSetMb} MB.", data: data));
            }

            return Task.FromResult(
                HealthCheckResult.Healthy($"Memory consumption normal: {workingSetMb} MB working set.", data));
        }
        catch (Exception ex)
        {
            return Task.FromResult(
                HealthCheckResult.Unhealthy("Failed to measure process memory.", ex));
        }
    }
}

