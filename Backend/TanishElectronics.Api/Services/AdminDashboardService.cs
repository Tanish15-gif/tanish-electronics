using TanishElectronics.Api.DTOs.Admin.Dashboard;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;
using TanishElectronics.Api.Services;

public class AdminDashboardService : IAdminDashboardService
{
    private readonly IAdminDashboardRepository _repository;
    private readonly IAppMemoryCacheService _cacheService;
    public AdminDashboardService(IAdminDashboardRepository repository, IAppMemoryCacheService cacheService)
    {
        _repository = repository;
        _cacheService = cacheService;
    }
    public async Task<AdminDashboardSummaryDto> GetSummaryAsync()
    {
        return await _cacheService.GetOrCreateAsync(
            "admin-dashboard-summary",
            async () =>
            {
                return await _repository.GetSummaryAsync();
            },
            TimeSpan.FromSeconds(30)
        );
    }
}