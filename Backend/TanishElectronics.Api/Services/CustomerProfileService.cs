using TanishElectronics.Api.DTOs.Customer.Profile;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class CustomerProfileService : ICustomerProfileService
{
    private readonly ICustomerProfileRepository _repository;
    public CustomerProfileService(ICustomerProfileRepository repository)
    {
        _repository = repository;
    }

    public async Task<CustomerAddressDto> AddAddressAsync(string clerkUserId, UpsertCustomerAddressDto dto)
    {
        ValidateAddress(dto);
        return await _repository.AddAddressAsync(clerkUserId, dto);
    }

    public async Task DeleteAddressAsync(string clerkUserId, int addressId)
    {
        await _repository.DeleteAddressAsync(clerkUserId, addressId);
    }

    public async Task<List<CustomerAddressDto>> GetAddressesAsync(string clerkUserId)
    {
        return await _repository.GetAddressessAsync(clerkUserId);
    }

    public async Task<CustomerProfileDto> GetProfileAsync(string clerkUserId)
    {
        var profile = await _repository.GetProfileAsync(clerkUserId);

        if (profile == null) throw new KeyNotFoundException("Customer profile not found");
        return profile;
    }

    public async Task<CustomerAddressDto> SetDefaultAddressAsync(string clerkUserId, int addressId)
    {
        return await _repository.SetDefaultAddressAsync(clerkUserId, addressId);
    }

    public async Task<CustomerAddressDto> UpdateAddressAsync(string clerkUserId, int addressId, UpsertCustomerAddressDto dto)
    {
        ValidateAddress(dto);
        return await _repository.UpdateAddressAsync(clerkUserId, addressId, dto);
    }

    public async Task<CustomerProfileDto> UpdateProfileAsync(string clerkUserId, UpdateCustomerProfileDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName))
        {
            throw new InvalidOperationException("Full name is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.PhoneNumber))
        {
            throw new InvalidOperationException("Phone number is required.");
        }
        var digitsOnly = new string(dto.PhoneNumber.Where(char.IsDigit).ToArray());

        if (digitsOnly.Length < 10)
        {
            throw new InvalidOperationException("Enter a valid PhoneNumber");
        }
        return await _repository.UpdateProfileAsync(clerkUserId, dto);
    }
    private static void ValidateAddress(UpsertCustomerAddressDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.AddressLine))
        {
            throw new InvalidOperationException("Address line is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.City))
        {
            throw new InvalidOperationException("City is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.State))
        {
            throw new InvalidOperationException("State is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Pincode))
        {
            throw new InvalidOperationException("Pincode is required.");
        }

        var digitsOnly = new string(dto.Pincode.Where(char.IsDigit).ToArray());

        if (digitsOnly.Length != 6)
        {
            throw new InvalidOperationException("Enter a valid 6 digit pincode.");
        }
    }
}