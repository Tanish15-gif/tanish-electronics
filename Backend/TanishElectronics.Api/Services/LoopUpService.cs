using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class LookUpService : ILookUpService
{
    private readonly TanishElectronicsDbContext _dbcontext;
    public LookUpService(TanishElectronicsDbContext dbContext)
    {
        _dbcontext = dbContext;
    }

    public async Task<List<LookUpDto>> GetEnquiryStatusesAsync()
    {
        return await _dbcontext.EnquiryStatuses
            .Where(status => status.IsActive)
            .Select(status => new LookUpDto
            {
                Id = status.EnquiryStatusId,
                Name = status.StatusName
            }).ToListAsync();
    }

    public async Task<List<LookUpDto>> GetProductCategoriesAsync()
    {
        return await _dbcontext.ProductCategories
            .Where(category => category.IsActive)
            .Select(category => new LookUpDto
            {
                Id = category.ProductCategoryId,
                Name = category.CategoryName
            })
            .ToListAsync();
    }

    public async Task<List<LookUpDto>> GetProductConditionsAsync()
    {
        return await _dbcontext.ProductConditions
            .Select(condition => new LookUpDto
            {
                Id = condition.ProductConditionId,
                Name = condition.ConditionName
            })
            .ToListAsync();
    }

    public async Task<List<LookUpDto>> GetServiceCategoriesAsync()
    {
        return await _dbcontext.ServiceCategories
            .Where(category => category.IsActive)
            .Select(category => new LookUpDto
            {
                Id = category.ServiceCategoryId,
                Name = category.CategoryName
            })
            .ToListAsync();
    }

    public async Task<List<LookUpDto>> GetServiceLocationAsync()
    {
        return await _dbcontext.ServiceLocations
            .Where(location => location.IsActive && location.IsHomeVisitAvailable)
            .Select(location => new LookUpDto
            {
                Id = location.ServiceLocationId,
                Name = location.LocationName
            })
            .ToListAsync();
    }
    public async Task<List<LookUpDto>> GetServiceStatusesAsync()
    {
        return await _dbcontext.ServiceStatuses
            .Where(status => status.IsActive)
            .Select(status => new LookUpDto
            {
                Id = status.ServiceStatusId,
                Name = status.StatusName
            })
            .ToListAsync();
    }

}