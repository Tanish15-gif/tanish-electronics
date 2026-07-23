using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace TanishElectronics.Api.Helpers;

public static class HealthCheckResponseWriter
{
    public static async Task WriteJsonResponse(
        HttpContext httpContext,
        HealthReport report
    )
    {
        httpContext.Response.ContentType = "application/json";

        var response = new
        {
            status = report.Status.ToString(),
            totalDurationMs = report.TotalDuration.TotalMilliseconds,
            checks = report.Entries.Select(entry => new
            {
                name = entry.Key,
                status = entry.Value.Status.ToString(),
                durationMs = entry.Value.Duration.TotalMilliseconds,
                description = entry.Value.Description,
                data = entry.Value.Data
            })
        };

        await httpContext.Response.WriteAsync(
            JsonSerializer.Serialize(
                response,
                new JsonSerializerOptions
                {
                    WriteIndented = true
                }
            )
        );
    }
}