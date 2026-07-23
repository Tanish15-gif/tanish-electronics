using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.BackgroundServices;

public class AnnouncementExpiryBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AnnouncementExpiryBackgroundService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1);

    public AnnouncementExpiryBackgroundService
    (
        IServiceScopeFactory scopeFactory,
        ILogger<AnnouncementExpiryBackgroundService> logger
    )
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Announcement expiry background service started.");

        await ExpireAnnouncementsAsync(stoppingToken);

        using var timer = new PeriodicTimer(_checkInterval);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await ExpireAnnouncementsAsync(stoppingToken);
        }
    }
    private async Task ExpireAnnouncementsAsync(CancellationToken stoppingToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var announcementService = scope.ServiceProvider.GetRequiredService<IAnnouncementService>();

            var expiredCount = await announcementService.ExpireAnnouncementsAsync();

            if (expiredCount > 0)
            {
                _logger.LogInformation("{ExpiredCount} expired announcement(s) deactivated.", expiredCount);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            //App will shut down
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to deactivate expired announcements.");
        }
    }
}