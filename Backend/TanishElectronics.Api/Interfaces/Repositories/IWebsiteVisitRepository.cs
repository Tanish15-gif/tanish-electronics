using TanishElectronics.Api.DTOs.Admin.Analytics;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Repositories;

public interface IWebsiteVisitRepository
{
    Task AddAsync(WebsiteVisit websiteVisit);

    Task<AdminAnalyticsSummaryDto> GetAdminAnalyticsSummaryAsync();

    Task<PagedResultDto<AdminRecentVisitDto>> GetAdminWebsiteVisitsAsync(
        AdminWebsiteVisitQueryDto query
    );
}