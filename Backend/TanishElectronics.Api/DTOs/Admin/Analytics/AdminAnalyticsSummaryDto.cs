namespace TanishElectronics.Api.DTOs.Admin.Analytics;

public class AdminAnalyticsSummaryDto
{
    public int TotalVisits { get; set; }

    public int TodayVisits { get; set; }

    public int Last7DaysVisits { get; set; }

    public int UniqueVisitors { get; set; }

    public List<AdminTopPageDto> TopPages { get; set; } = new();

    public List<AdminDailyVisitDto> DailyVisits { get; set; } = new();

    public List<AdminRecentVisitDto> RecentVisits { get; set; } = new();
}