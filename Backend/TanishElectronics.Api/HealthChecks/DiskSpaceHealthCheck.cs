using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace TanishElectronics.Api.HealthChecks;

public class DiskSpaceHealthCheck : IHealthCheck
{
    private readonly IWebHostEnvironment _environment;

    public DiskSpaceHealthCheck(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var appPath = _environment.ContentRootPath;
            var driveInfo = new DriveInfo(Path.GetPathRoot(Path.GetFullPath(appPath)) ?? "C:\\");

            var totalGb = Math.Round(driveInfo.TotalSize / (1024.0 * 1024.0 * 1024.0), 2);
            var freeGb = Math.Round(driveInfo.AvailableFreeSpace / (1024.0 * 1024.0 * 1024.0), 2);
            var freePercent = Math.Round((driveInfo.AvailableFreeSpace / (double)driveInfo.TotalSize) * 100, 1);

            var data = new Dictionary<string, object>
            {
                ["driveName"] = driveInfo.Name,
                ["totalGb"] = totalGb,
                ["freeGb"] = freeGb,
                ["freePercentage"] = freePercent
            };

            if (freePercent < 5 || freeGb < 2)
            {
                return Task.FromResult(
                    HealthCheckResult.Unhealthy($"Critical disk space: {freeGb} GB ({freePercent}%) remaining on {driveInfo.Name}.", data: data));
            }

            if (freePercent < 15 || freeGb < 10)
            {
                return Task.FromResult(
                    HealthCheckResult.Degraded($"Low disk space: {freeGb} GB ({freePercent}%) remaining on {driveInfo.Name}.", data: data));
            }

            return Task.FromResult(
                HealthCheckResult.Healthy($"Sufficient disk space: {freeGb} GB ({freePercent}%) available on {driveInfo.Name}.", data));
        }
        catch (Exception ex)
        {
            return Task.FromResult(
                HealthCheckResult.Unhealthy("Failed to check disk space.", ex));
        }
    }
}

