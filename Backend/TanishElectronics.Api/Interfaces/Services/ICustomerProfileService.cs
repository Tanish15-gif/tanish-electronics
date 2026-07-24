using TanishElectronics.Api.DTOs.Customer.Profile;

namespace TanishElectronics.Api.Interfaces.Services;

public interface ICustomerProfileService
{
    Task<CustomerProfileDto> GetProfileAsync();
    Task<CustomerProfileDto> UpdateProfileAsync(UpdateCustomerProfileDto dto);

    Task<List<CustomerAddressDto>> GetAddressesAsync();

    Task<CustomerAddressDto> AddAddressAsync(UpsertCustomerAddressDto dto);

    Task<CustomerAddressDto> UpdateAddressAsync(int addressId, UpsertCustomerAddressDto dto);

    Task<CustomerAddressDto> SetDefaultAddressAsync(int addressId);

    Task DeleteAddressAsync(int addressId);
}