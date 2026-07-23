using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace TanishElectronics.Api.HealthChecks;

public class UploadStorageHealthCheck : IHealthCheck
{
    private readonly IWebHostEnvironment _environment;

    public UploadStorageHealthCheck(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default
    )
    {
        try
        {
            var uploadsPath = Path.Combine(
                _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
                "uploads"
            );

            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            var testFilePath = Path.Combine(
                uploadsPath,
                $"health-check-{Guid.NewGuid():N}.tmp"
            );

            await File.WriteAllTextAsync(
                testFilePath,
                "ok",
                cancellationToken
            );

            var canRead = await File.ReadAllTextAsync(
                testFilePath,
                cancellationToken
            );

            File.Delete(testFilePath);

            if (canRead != "ok")
            {
                return HealthCheckResult.Unhealthy(
                    "Upload storage is not readable."
                );
            }

            return HealthCheckResult.Healthy(
                "Upload storage is readable and writable."
            );
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy(
                "Upload storage is not available.",
                ex
            );
        }
    }
}