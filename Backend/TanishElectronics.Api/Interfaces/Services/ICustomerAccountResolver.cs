using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Services;

public interface ICustomerAccountResolver
{
    Task<AppUser?> GetCurrentAppUserAsync();
    Task<Customer?> GetCurrentCustomerAsync();
    Task<CustomerAddress?> GetDefaultAddressAsync(int customerId);
}