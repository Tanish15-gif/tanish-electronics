using TanishElectronics.Api.DTOs.Admin.Dashboard;

namespace TanishElectronics.Api.Interfaces.Services;

public interface IAdminDashboardService
{
    Task<AdminDashboardSummaryDto> GetSummaryAsync();
}