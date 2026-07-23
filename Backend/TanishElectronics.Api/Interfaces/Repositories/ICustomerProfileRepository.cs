using TanishElectronics.Api.DTOs.Customer.Profile;
using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Services;

public interface ICustomerProfileRepository
{
    Task<AppUser?> GetAppUserByClerkIdAsync(string clerkUserId);
    Task<Customer?> GetCustomerByAppUserIdAsync(int appUserId);

    Task<CustomerProfileDto?> GetProfileAsync(string clerkUserId);

    Task<CustomerProfileDto> UpdateProfileAsync(string clerkUserId, UpdateCustomerProfileDto dto);

    Task<List<CustomerAddressDto>> GetAddressessAsync(string clerkUserId);

    Task<CustomerAddressDto> AddAddressAsync(string clerkUserId, UpsertCustomerAddressDto dto);

    Task<CustomerAddressDto> UpdateAddressAsync(string clerkUserId, int addressId, UpsertCustomerAddressDto dto);

    Task<CustomerAddressDto> SetDefaultAddressAsync(string clerkUserId, int addressId);

    Task DeleteAddressAsync(string clerkUserId, int addressId);
    Task SaveChangesAsync();
}