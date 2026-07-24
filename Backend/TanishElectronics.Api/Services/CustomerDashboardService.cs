using TanishElectronics.Api.DTOs.Customer.DashBoard;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;
using TanishElectronics.Api.Repositories;

namespace TanishElectronics.Api.Services;

public class CustomerDashboardService : ICustomerDashboardService
{
    private readonly ICustomerDashboardRepository _repository;
    private readonly ICurrentUserService _currentUserService;
    public CustomerDashboardService(ICustomerDashboardRepository repository, ICurrentUserService currentUserService)
    {
        _repository = repository;
        _currentUserService = currentUserService;
    }

    public async Task<CustomerDashBoardDto> GetDashBoardAsync()
    {
        var appUserId = await _currentUserService.GetRequiredCurrentAppUserIdAsync();

        var dashboard = await _repository.GetDashBoardAsync(appUserId);
        if (dashboard == null)
        {
            throw new KeyNotFoundException("Customer account not found");
        }
        return dashboard;
    }
}