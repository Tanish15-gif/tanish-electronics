using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Services;

public interface ICustomerAccountResolver
{
    Task<AppUser?> GetCurrentAppUserAsync();

    Task<Customer?> GetCurrentCustomerAsync();

    Task<int?> GetCurrentCustomerIdAsync();

    Task<int> GetRequiredCustomerIdAsync();

    Task<CustomerAddress?> GetDefaultAddressAsync(int customerId);
}