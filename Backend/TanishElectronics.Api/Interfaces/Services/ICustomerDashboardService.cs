using TanishElectronics.Api.DTOs.Customer.DashBoard;

namespace TanishElectronics.Api.Interfaces.Services;

public interface ICustomerDashboardService
{
    Task<CustomerDashBoardDto> GetDashBoardAsync();
}