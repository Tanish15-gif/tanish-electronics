using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class CustomerAccountResolver : ICustomerAccountResolver
{
    private readonly TanishElectronicsDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;

    public CustomerAccountResolver(
        TanishElectronicsDbContext dbContext,
        ICurrentUserService currentUserService
    )
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
    }

    public async Task<AppUser?> GetCurrentAppUserAsync()
    {
        var appUserId = await _currentUserService.GetCurrentAppUserIdAsync();

        if (appUserId == null)
        {
            return null;
        }

        return await _dbContext.AppUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(appUser =>
                appUser.AppUserId == appUserId.Value &&
                appUser.DeletedAt == null &&
                appUser.IsActive
            );
    }

    public async Task<Customer?> GetCurrentCustomerAsync()
    {
        var appUserId = await _currentUserService.GetCurrentAppUserIdAsync();

        if (appUserId == null)
        {
            return null;
        }

        return await _dbContext.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(customer =>
                customer.AppUserId == appUserId.Value &&
                customer.DeletedAt == null &&
                customer.IsActive
            );
    }

    public async Task<int?> GetCurrentCustomerIdAsync()
    {
        var appUserId = await _currentUserService.GetCurrentAppUserIdAsync();

        if (appUserId == null)
        {
            return null;
        }

        return await _dbContext.Customers
            .AsNoTracking()
            .Where(customer =>
                customer.AppUserId == appUserId.Value &&
                customer.DeletedAt == null &&
                customer.IsActive
            )
            .Select(customer => (int?)customer.CustomerId)
            .FirstOrDefaultAsync();
    }

    public async Task<int> GetRequiredCustomerIdAsync()
    {
        var customerId = await GetCurrentCustomerIdAsync();

        if (customerId == null)
        {
            throw new KeyNotFoundException("Customer account not found");
        }

        return customerId.Value;
    }

    public async Task<CustomerAddress?> GetDefaultAddressAsync(int customerId)
    {
        return await _dbContext.CustomerAddresses
            .AsNoTracking()
            .Where(address =>
                address.CustomerId == customerId &&
                address.IsActive
            )
            .OrderByDescending(address => address.IsDefault)
            .ThenByDescending(address => address.CreatedAt)
            .FirstOrDefaultAsync();
    }
}