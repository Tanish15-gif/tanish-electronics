using TanishElectronics.Api.DTOs.Admin.Analytics;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.DTOs.Public;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class WebsiteVisitService : IWebsiteVisitService
{
    private readonly IWebsiteVisitRepository _visitRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public WebsiteVisitService(
        IWebsiteVisitRepository visitRepository,
        ICurrentUserService currentUserService,
        IHttpContextAccessor httpContextAccessor
    )
    {
        _visitRepository = visitRepository;
        _currentUserService = currentUserService;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<AdminAnalyticsSummaryDto> GetAdminAnalyticsSummaryAsync()
    {
        return await _visitRepository.GetAdminAnalyticsSummaryAsync();
    }

    public async Task<PagedResultDto<AdminRecentVisitDto>> GetAdminWebsiteVisitsAsync(AdminWebsiteVisitQueryDto query)
    {
        return await _visitRepository.GetAdminWebsiteVisitsAsync(query);
    }

    public async Task TrackVisitAsync(CreateWebsiteVisitDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Path))
        {
            throw new InvalidOperationException("Visit path is required.");
        }

        if (dto.Path.Length > 300)
        {
            throw new InvalidOperationException("Visit path is too long.");
        }

        var appUserId = await _currentUserService.GetCurrentAppUserIdAsync();

        var httpContext = _httpContextAccessor.HttpContext;

        var visit = new WebsiteVisit
        {
            VisitorId = dto.VisitorId,
            AppUserId = appUserId,
            Path = dto.Path.Trim(),
            Referrer = string.IsNullOrWhiteSpace(dto.Referrer)
                ? null
                : dto.Referrer.Trim(),
            IpAddress = GetClientIpAddress(httpContext),
            UserAgent = httpContext?.Request.Headers.UserAgent.ToString(),
            CreatedAt = DateTime.UtcNow
        };

        await _visitRepository.AddAsync(visit);
    }

    private static string? GetClientIpAddress(HttpContext? httpContext)
    {
        if (httpContext == null)
        {
            return null;
        }

        var forwardedFor =
            httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(forwardedFor))
        {
            return forwardedFor.Split(",")[0].Trim();
        }

        return httpContext.Connection.RemoteIpAddress?.ToString();
    }
}