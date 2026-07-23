using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class CustomerAccountResolver : ICustomerAccountResolver
{
    private readonly TanishElectronicsDbContext _dbContext;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CustomerAccountResolver(TanishElectronicsDbContext dbContext, IHttpContextAccessor httpContextAccessor)
    {
        _dbContext = dbContext;
        _httpContextAccessor = httpContextAccessor;
    }
    public async Task<AppUser?> GetCurrentAppUserAsync()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        if (user == null || user.Identity?.IsAuthenticated != true)
        {
            return null!;
        }
        var clerkUserId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(clerkUserId))
        {
            return null!;
        }
        return await _dbContext.AppUsers
            .FirstOrDefaultAsync(appUser =>
                appUser.ClerkUserId == clerkUserId &&
                appUser.DeletedAt == null &&
                appUser.IsActive);
    }

    public async Task<Customer?> GetCurrentCustomerAsync()
    {
        var appUser = await GetCurrentAppUserAsync();

        if (appUser == null)
        {
            return null;
        }

        return await _dbContext.Customers
            .FirstOrDefaultAsync(customer =>
                customer.AppUserId == appUser.AppUserId &&
                customer.DeletedAt == null &&
                customer.IsActive
            );
    }

    public async Task<CustomerAddress?> GetDefaultAddressAsync(int customerId)
    {
        return await _dbContext.CustomerAddresses
            .Where(address =>
                address.CustomerId == customerId &&
                address.IsActive
            )
            .OrderByDescending(address => address.IsDefault)
            .ThenByDescending(address => address.CreatedAt)
            .FirstOrDefaultAsync();
    }
}
