using TanishElectronics.Api.DTOs.Common;

namespace TanishElectronics.Api.Interfaces.Services;

public interface ILookUpService
{
    Task<List<LookUpDto>> GetServiceCategoriesAsync();
    Task<List<LookUpDto>> GetServiceLocationAsync();
    Task<List<LookUpDto>> GetServiceStatusesAsync();
    Task<List<LookUpDto>> GetEnquiryStatusesAsync();

    Task<List<LookUpDto>> GetProductCategoriesAsync();
    Task<List<LookUpDto>> GetProductConditionsAsync();
}