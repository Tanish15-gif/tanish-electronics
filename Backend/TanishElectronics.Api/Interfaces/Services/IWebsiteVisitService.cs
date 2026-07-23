using TanishElectronics.Api.DTOs.Admin.Analytics;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.DTOs.Public;

namespace TanishElectronics.Api.Interfaces.Services;

public interface IWebsiteVisitService
{
    Task TrackVisitAsync(CreateWebsiteVisitDto dto);

    Task<AdminAnalyticsSummaryDto> GetAdminAnalyticsSummaryAsync();

    Task<PagedResultDto<AdminRecentVisitDto>> GetAdminWebsiteVisitsAsync(AdminWebsiteVisitQueryDto query);
}