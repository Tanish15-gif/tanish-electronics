using TanishElectronics.Api.DTOs.Admin.Dashboard;

namespace TanishElectronics.Api.Interfaces.Repositories;

public interface IAdminDashboardRepository
{
    Task<AdminDashboardSummaryDto> GetSummaryAsync();
}