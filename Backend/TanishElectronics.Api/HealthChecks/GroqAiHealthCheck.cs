using System.Diagnostics;
using System.Net.Http.Headers;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using TanishElectronics.Api.Settings;

namespace TanishElectronics.Api.HealthChecks;

public class GroqAiHealthCheck : IHealthCheck
{
    private readonly HttpClient _httpClient;
    private readonly GroqSettings _groqSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<GroqAiHealthCheck> _logger;
    private const string ModelsEndpoint = "https://api.groq.com/openai/v1/models";
    private const string CacheKey = "healthcheck:groq-ai:status";

    public GroqAiHealthCheck(
        HttpClient httpClient,
        IOptions<GroqSettings> groqSettings,
        IMemoryCache memoryCache,
        ILogger<GroqAiHealthCheck> logger)
    {
        _httpClient = httpClient;
        _groqSettings = groqSettings.Value;
        _memoryCache = memoryCache;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (_memoryCache.TryGetValue(CacheKey, out HealthCheckResult cachedResult))
        {
            return cachedResult;
        }

        var stopWatch = Stopwatch.StartNew();

        if (string.IsNullOrWhiteSpace(_groqSettings.ApiKey))
        {
            return HealthCheckResult.Degraded(
                "Groq API key is not configured.",
                data: new Dictionary<string, object>
                {
                    ["model"] = _groqSettings.Model ?? "N/A",
                    ["status"] = "MissingApiKey"
                });
        }

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, ModelsEndpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _groqSettings.ApiKey);

            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(5));

            var response = await _httpClient.SendAsync(request, timeoutCts.Token);
            stopWatch.Stop();

            var latencyMs = stopWatch.ElapsedMilliseconds;
            var data = new Dictionary<string, object>
            {
                ["latencyMs"] = latencyMs,
                ["configuredModel"] = _groqSettings.Model,
                ["statusCode"] = (int)response.StatusCode
            };

            HealthCheckResult result;
            if (response.IsSuccessStatusCode)
            {
                if (latencyMs > 2500)
                {
                    result = HealthCheckResult.Degraded("Groq AI API is reachable but response time is slow.", data: data);
                }
                else
                {
                    result = HealthCheckResult.Healthy("Groq AI API is online and responsive.", data);
                }
            }
            else
            {
                _logger.LogWarning("Groq AI health check returned non-success status code: {StatusCode}", response.StatusCode);
                result = HealthCheckResult.Degraded($"Groq AI API returned {(int)response.StatusCode} {response.StatusCode}.", data: data);
            }

            _memoryCache.Set(CacheKey, result, TimeSpan.FromMinutes(3));
            return result;
        }
        catch (Exception ex)
        {
            stopWatch.Stop();
            _logger.LogWarning(ex, "Groq AI health check failed after {LatencyMs}ms", stopWatch.ElapsedMilliseconds);

            var result = HealthCheckResult.Degraded(
                "Groq AI API is currently unreachable.",
                ex,
                new Dictionary<string, object>
                {
                    ["latencyMs"] = stopWatch.ElapsedMilliseconds,
                    ["configuredModel"] = _groqSettings.Model
                });

            // Cache error state for 1 minute so it doesn't repeatedly retry on network glitch
            _memoryCache.Set(CacheKey, result, TimeSpan.FromMinutes(1));
            return result;
        }
    }
}

