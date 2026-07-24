using TanishElectronics.Api.DTOs.Customer.Profile;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class CustomerProfileService : ICustomerProfileService
{
    private readonly ICustomerProfileRepository _repository;
    private readonly ICurrentUserService _currentUserService;

    public CustomerProfileService(
        ICustomerProfileRepository repository,
        ICurrentUserService currentUserService
    )
    {
        _repository = repository;
        _currentUserService = currentUserService;
    }

    public async Task<CustomerAddressDto> AddAddressAsync(
        UpsertCustomerAddressDto dto
    )
    {
        ValidateAddress(dto);

        var appUserId = await _currentUserService.GetRequiredCurrentAppUserIdAsync();

        return await _repository.AddAddressAsync(appUserId, dto);
    }

    public async Task DeleteAddressAsync(int addressId)
    {
        var appUserId = await _currentUserService.GetRequiredCurrentAppUserIdAsync();

        await _repository.DeleteAddressAsync(appUserId, addressId);
    }

    public async Task<List<CustomerAddressDto>> GetAddressesAsync()
    {
        var appUserId = await _currentUserService.GetRequiredCurrentAppUserIdAsync();

        return await _repository.GetAddressessAsync(appUserId);
    }

    public async Task<CustomerProfileDto> GetProfileAsync()
    {
        var appUserId = await _currentUserService.GetRequiredCurrentAppUserIdAsync();

        var profile = await _repository.GetProfileAsync(appUserId);

        if (profile == null)
        {
            throw new KeyNotFoundException("Customer profile not found");
        }

        return profile;
    }

    public async Task<CustomerAddressDto> SetDefaultAddressAsync(int addressId)
    {
        var appUserId = await _currentUserService.GetRequiredCurrentAppUserIdAsync();

        return await _repository.SetDefaultAddressAsync(appUserId, addressId);
    }

    public async Task<CustomerAddressDto> UpdateAddressAsync(
        int addressId,
        UpsertCustomerAddressDto dto
    )
    {
        ValidateAddress(dto);

        var appUserId = await _currentUserService.GetRequiredCurrentAppUserIdAsync();

        return await _repository.UpdateAddressAsync(appUserId, addressId, dto);
    }

    public async Task<CustomerProfileDto> UpdateProfileAsync(
        UpdateCustomerProfileDto dto
    )
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

        var appUserId = await _currentUserService.GetRequiredCurrentAppUserIdAsync();

        return await _repository.UpdateProfileAsync(appUserId, dto);
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