using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Admin.Analytics;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;

namespace TanishElectronics.Api.Repositories;

public class WebsiteVisitRepository : IWebsiteVisitRepository
{
    private readonly TanishElectronicsDbContext _dbContext;

    public WebsiteVisitRepository(TanishElectronicsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(WebsiteVisit websiteVisit)
    {
        _dbContext.WebsiteVisits.Add(websiteVisit);

        await _dbContext.SaveChangesAsync();
    }

    public async Task<AdminAnalyticsSummaryDto> GetAdminAnalyticsSummaryAsync()
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        var last7Days = today.AddDays(-6);
        var tomorrow = today.AddDays(1);

        var totalVisits = await _dbContext.WebsiteVisits
            .AsNoTracking()
            .CountAsync();

        var todayVisits = await _dbContext.WebsiteVisits
            .AsNoTracking()
            .CountAsync(visit =>
                visit.CreatedAt >= today &&
                visit.CreatedAt < tomorrow
            );

        var last7DaysVisits = await _dbContext.WebsiteVisits
            .AsNoTracking()
            .CountAsync(visit => visit.CreatedAt >= last7Days);

        var uniqueVisitors = await _dbContext.WebsiteVisits
            .AsNoTracking()
            .Where(visit => visit.VisitorId != null)
            .Select(visit => visit.VisitorId)
            .Distinct()
            .CountAsync();

        var topPages = await _dbContext.WebsiteVisits
            .AsNoTracking()
            .GroupBy(visit => visit.Path)
            .OrderByDescending(group => group.Count())
            .Take(8)
            .Select(group => new AdminTopPageDto
            {
                Path = group.Key,
                VisitCount = group.Count()
            })
            .ToListAsync();

        var dailyVisitsRaw = await _dbContext.WebsiteVisits
            .AsNoTracking()
            .Where(visit => visit.CreatedAt >= last7Days)
            .GroupBy(visit => visit.CreatedAt.Date)
            .Select(group => new
            {
                Date = group.Key,
                VisitCount = group.Count()
            })
            .ToListAsync();

        var dailyVisitsMap = dailyVisitsRaw.ToDictionary(
            item => item.Date,
            item => item.VisitCount
        );

        var dailyVisits = Enumerable.Range(0, 7)
            .Select(index =>
            {
                var date = last7Days.AddDays(index);

                return new AdminDailyVisitDto
                {
                    Date = date,
                    VisitCount = dailyVisitsMap.TryGetValue(
                        date,
                        out var visitCount
                    )
                        ? visitCount
                        : 0
                };
            })
            .ToList();

        var recentVisits = await _dbContext.WebsiteVisits
            .AsNoTracking()
            .OrderByDescending(visit => visit.CreatedAt)
            .Take(20)
            .Select(visit => new AdminRecentVisitDto
            {
                WebsiteVisitId = visit.WebsiteVisitId,
                VisitorId = visit.VisitorId,
                AppUserId = visit.AppUserId,
                Path = visit.Path,
                Refferer = visit.Referrer,
                IpAddress = visit.IpAddress,
                UserAgent = visit.UserAgent,
                CreatedAt = visit.CreatedAt
            })
            .ToListAsync();

        return new AdminAnalyticsSummaryDto
        {
            TotalVisits = totalVisits,
            TodayVisits = todayVisits,
            Last7DaysVisits = last7DaysVisits,
            UniqueVisitors = uniqueVisitors,
            TopPages = topPages,
            DailyVisits = dailyVisits,
            RecentVisits = recentVisits
        };
    }

    public async Task<PagedResultDto<AdminRecentVisitDto>> GetAdminWebsiteVisitsAsync(
        AdminWebsiteVisitQueryDto query
    )
    {
        query ??= new AdminWebsiteVisitQueryDto();

        query.PageNumber = Math.Max(query.PageNumber, 1);
        query.PageSize = Math.Clamp(query.PageSize, 1, 50);

        var visitQuery = _dbContext.WebsiteVisits
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var searchText = query.Search.Trim();

            visitQuery = visitQuery.Where(visit =>
                visit.Path.Contains(searchText) ||
                (
                    visit.Referrer != null &&
                    visit.Referrer.Contains(searchText)
                ) ||
                (
                    visit.IpAddress != null &&
                    visit.IpAddress.Contains(searchText)
                ) ||
                (
                    visit.UserAgent != null &&
                    visit.UserAgent.Contains(searchText)
                )
            );
        }

        var totalRecords = await visitQuery.CountAsync();

        var totalPages = (int)Math.Ceiling(
            totalRecords / (double)query.PageSize
        );

        var items = await visitQuery
            .OrderByDescending(visit => visit.CreatedAt)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(visit => new AdminRecentVisitDto
            {
                WebsiteVisitId = visit.WebsiteVisitId,
                VisitorId = visit.VisitorId,
                AppUserId = visit.AppUserId,
                Path = visit.Path,
                Refferer = visit.Referrer,
                IpAddress = visit.IpAddress,
                UserAgent = visit.UserAgent,
                CreatedAt = visit.CreatedAt
            })
            .ToListAsync();

        return new PagedResultDto<AdminRecentVisitDto>
        {
            Items = items,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            TotalRecords = totalRecords,
            TotalPages = Math.Max(totalPages, 1)
        };
    }
}