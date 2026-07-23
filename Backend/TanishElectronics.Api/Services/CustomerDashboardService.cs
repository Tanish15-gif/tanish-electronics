using TanishElectronics.Api.DTOs.Customer.DashBoard;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;
using TanishElectronics.Api.Repositories;

namespace TanishElectronics.Api.Services;

public class CustomerDashboardService : ICustomerDashboardService
{
    private readonly ICustomerDashboardRepository _repository;
    public CustomerDashboardService(ICustomerDashboardRepository repository)
    {
        _repository = repository;
    }

    public async Task<CustomerDashBoardDto> GetDashBoardAsync(string clerkUserId)
    {
        var Dashboard = await _repository.GetDashBoardAsync(clerkUserId);
        if (Dashboard == null)
        {
            throw new KeyNotFoundException("Customer account not found");
        }
        return Dashboard;
    }
}