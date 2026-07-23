using TanishElectronics.Api.DTOs.Customer.DashBoard;

namespace TanishElectronics.Api.Interfaces.Repositories;

public interface ICustomerDashboardRepository
{
    Task<CustomerDashBoardDto?> GetDashBoardAsync(string clerkUserId);
}