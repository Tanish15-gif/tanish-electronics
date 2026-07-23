using TanishElectronics.Api.DTOs.Customer.Profile;

namespace TanishElectronics.Api.Interfaces.Services;

public interface ICustomerProfileService
{
    Task<CustomerProfileDto> GetProfileAsync(string clerkUserId);
    Task<CustomerProfileDto> UpdateProfileAsync(string clerkUserId, UpdateCustomerProfileDto dto);

    Task<List<CustomerAddressDto>> GetAddressesAsync(string clerkUserId);

    Task<CustomerAddressDto> AddAddressAsync(string clerkUserId, UpsertCustomerAddressDto dto);

    Task<CustomerAddressDto> UpdateAddressAsync(string clerkUserId, int addressId, UpsertCustomerAddressDto dto);

    Task<CustomerAddressDto> SetDefaultAddressAsync(string clerkUserId, int addressId);

    Task DeleteAddressAsync(string clerkUserId, int addressId);
}