using TanishElectronics.Api.DTOs.Customer.Profile;
using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Services;

public interface ICustomerProfileRepository
{
    Task<CustomerAddressDto> AddAddressAsync(
        int appUserId,
        UpsertCustomerAddressDto dto
    );

    Task DeleteAddressAsync(int appUserId, int addressId);

    Task<List<CustomerAddressDto>> GetAddressessAsync(int appUserId);

    Task<AppUser?> GetAppUserByIdAsync(int appUserId);

    Task<Customer?> GetCustomerByAppUserIdAsync(int appUserId);

    Task<CustomerProfileDto?> GetProfileAsync(int appUserId);

    Task<CustomerAddressDto> SetDefaultAddressAsync(
        int appUserId,
        int addressId
    );

    Task<CustomerProfileDto> UpdateProfileAsync(
        int appUserId,
        UpdateCustomerProfileDto dto
    );

    Task<CustomerAddressDto> UpdateAddressAsync(
        int appUserId,
        int addressId,
        UpsertCustomerAddressDto dto
    );

    Task SaveChangesAsync();
}