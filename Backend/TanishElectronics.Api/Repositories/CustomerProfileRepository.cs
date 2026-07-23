using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Customer.Profile;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Repositories;

public class CustomerProfileRepository : ICustomerProfileRepository
{
    private readonly TanishElectronicsDbContext _dbContext;
    public CustomerProfileRepository(TanishElectronicsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CustomerAddressDto> AddAddressAsync(string clerkUserId, UpsertCustomerAddressDto dto)
    {
        var customer = await GetCustomerForClerkUserAsync(clerkUserId);

        var hasAnyAddress = await _dbContext.CustomerAddresses
            .AnyAsync(address =>
                address.CustomerId == customer.CustomerId && customer.IsActive);

        var shouldBeDefault = dto.IsDefault || !hasAnyAddress;

        if (shouldBeDefault)
        {
            await ClearDefaultAddressesAsync(customer.CustomerId);
        }

        var address = new CustomerAddress
        {
            CustomerId = customer.CustomerId,
            Label = string.IsNullOrWhiteSpace(dto.Label) ? null : dto.Label.Trim(),
            AddressLine = dto.AddressLine.Trim(),
            City = dto.City.Trim(),
            State = dto.State.Trim(),
            Pincode = dto.Pincode.Trim(),
            IsDefault = shouldBeDefault,
            IsActive = true,
            CreatedAt = DateTime.Now
        };

        await _dbContext.CustomerAddresses.AddAsync(address);
        await SaveChangesAsync();

        return MapAddress(address);
    }

    public async Task DeleteAddressAsync(string clerkUserId, int addressId)
    {
        var customer = await GetCustomerForClerkUserAsync(clerkUserId);

        var address = await _dbContext.CustomerAddresses
            .FirstOrDefaultAsync(address =>
                address.CustomerAddressId == addressId &&
                address.CustomerId == customer.CustomerId &&
                address.IsActive);

        if (address == null)
        {
            throw new KeyNotFoundException("Address not found.");
        }

        address.IsActive = false;
        address.IsDefault = false;
        address.UpdatedAt = DateTime.Now;

        await SaveChangesAsync();
    }

    public async Task<List<CustomerAddressDto>> GetAddressessAsync(string clerkUserId)
    {
        var customer = await GetCustomerForClerkUserAsync(clerkUserId);

        return await _dbContext.CustomerAddresses
            .Where(address =>
                address.CustomerId == customer.CustomerId &&
                address.IsActive)
            .OrderByDescending(address => address.IsDefault)
            .ThenByDescending(address => address.CreatedAt)
            .Select(address => new CustomerAddressDto
            {
                CustomerAddressId = address.CustomerAddressId,
                Label = address.Label,
                AddressLine = address.AddressLine,
                City = address.City,
                State = address.State,
                Pincode = address.Pincode,
                IsDefault = address.IsDefault
            }).ToListAsync();
    }

    public async Task<AppUser?> GetAppUserByClerkIdAsync(string clerkUserId)
    {
        return await _dbContext.AppUsers
            .FirstOrDefaultAsync(user =>
                user.ClerkUserId == clerkUserId &&
                user.DeletedAt == null &&
                user.IsActive);
    }

    public async Task<Customer?> GetCustomerByAppUserIdAsync(int appUserId)
    {
        return await _dbContext.Customers
            .FirstOrDefaultAsync(customer =>
                customer.AppUserId == appUserId &&
                customer.DeletedAt == null &&
                customer.IsActive);
    }

    public async Task<CustomerProfileDto?> GetProfileAsync(string clerkUserId)
    {
        var appUser = await GetAppUserByClerkIdAsync(clerkUserId);

        if (appUser == null)
        {
            return null;
        }
        var customer = await GetCustomerByAppUserIdAsync(appUser.AppUserId);

        return new CustomerProfileDto
        {
            AppUserId = appUser.AppUserId,
            CustomerId = customer?.CustomerId,
            FullName = customer?.FullName ?? appUser.FullName,
            Email = customer?.Email ?? appUser.Email,
            PhoneNumber = customer?.PhoneNumber ?? appUser.PhoneNumber,
            IsProfileCompleted =
        customer != null &&
        !string.IsNullOrWhiteSpace(customer.PhoneNumber),

            Addresses = customer == null
        ? new List<CustomerAddressDto>()
        : await _dbContext.CustomerAddresses
            .Where(address =>
                address.CustomerId == customer.CustomerId &&
                address.IsActive)
            .OrderByDescending(address => address.IsDefault)
            .ThenByDescending(address => address.CreatedAt)
            .Select(address => new CustomerAddressDto
            {
                CustomerAddressId = address.CustomerAddressId,
                Label = address.Label,
                AddressLine = address.AddressLine,
                City = address.City,
                State = address.State,
                Pincode = address.Pincode,
                IsDefault = address.IsDefault
            })
            .ToListAsync()
        };
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }

    public async Task<CustomerAddressDto> SetDefaultAddressAsync(string clerkUserId, int addressId)
    {
        var customer = await GetCustomerForClerkUserAsync(clerkUserId);

        var address = await _dbContext.CustomerAddresses
            .FirstOrDefaultAsync(address =>
                address.CustomerAddressId == addressId &&
                address.CustomerId == customer.CustomerId &&
                address.IsActive);

        if (address == null)
        {
            throw new KeyNotFoundException("Address not found.");
        }

        await ClearDefaultAddressesAsync(customer.CustomerId);

        address.IsDefault = true;
        address.UpdatedAt = DateTime.Now;

        await SaveChangesAsync();

        return MapAddress(address);
    }

    public async Task<CustomerProfileDto> UpdateProfileAsync(string clerkUserId, UpdateCustomerProfileDto dto)
    {
        var appUser = await GetAppUserByClerkIdAsync(clerkUserId);

        if (appUser == null) throw new KeyNotFoundException("User Account not found");

        var fullName = dto.FullName.Trim();
        var phoneNumber = dto.PhoneNumber.Trim();

        var customer = await GetCustomerByAppUserIdAsync(appUser.AppUserId);

        if (customer == null)
        {
            customer = new Customer
            {
                AppUserId = appUser.AppUserId,
                FullName = fullName,
                PhoneNumber = phoneNumber,
                Email = appUser.Email,
                IsActive = true,
                CreatedAt = DateTime.Now
            };

            await _dbContext.Customers.AddAsync(customer);
        }
        else
        {
            customer.FullName = fullName;
            customer.PhoneNumber = phoneNumber;
            customer.Email = appUser.Email;
            customer.IsActive = true;
            customer.DeletedAt = null;
            customer.UpdatedAt = DateTime.Now;
        }

        appUser.FullName = fullName;
        appUser.PhoneNumber = phoneNumber;
        appUser.UpdatedAt = DateTime.Now;

        await SaveChangesAsync();

        return new CustomerProfileDto
        {
            AppUserId = appUser.AppUserId,
            CustomerId = customer.CustomerId,
            FullName = customer.FullName,
            Email = customer.Email ?? appUser.Email,
            PhoneNumber = customer.PhoneNumber,
            IsProfileCompleted = true
        };
    }
    private async Task<Customer> GetCustomerForClerkUserAsync(string clerkUserId)
    {
        var appUser = await GetAppUserByClerkIdAsync(clerkUserId);

        if (appUser == null)
        {
            throw new KeyNotFoundException("User account not found.");
        }

        var customer = await GetCustomerByAppUserIdAsync(appUser.AppUserId);

        if (customer == null)
        {
            throw new InvalidOperationException(
                "Please complete your profile before adding an address."
            );
        }

        return customer;
    }
    private async Task ClearDefaultAddressesAsync(int customerId)
    {
        var defaultAddresses = await _dbContext.CustomerAddresses
            .Where(address =>
                address.CustomerId == customerId &&
                address.IsActive &&
                address.IsDefault)
            .ToListAsync();

        foreach (var address in defaultAddresses)
        {
            address.IsDefault = false;
            address.UpdatedAt = DateTime.Now;
        }
    }

    private static CustomerAddressDto MapAddress(CustomerAddress address)
    {
        return new CustomerAddressDto
        {
            CustomerAddressId = address.CustomerAddressId,
            Label = address.Label,
            AddressLine = address.AddressLine,
            City = address.City,
            State = address.State,
            Pincode = address.Pincode,
            IsDefault = address.IsDefault
        };
    }

    public async Task<CustomerAddressDto> UpdateAddressAsync(string clerkUserId, int addressId, UpsertCustomerAddressDto dto)
    {
        var customer = await GetCustomerForClerkUserAsync(clerkUserId);

        var address = await _dbContext.CustomerAddresses
            .FirstOrDefaultAsync(address =>
                address.CustomerAddressId == addressId &&
                address.CustomerId == customer.CustomerId &&
                address.IsActive);

        if (address == null)
        {
            throw new KeyNotFoundException("Address not found.");
        }

        if (dto.IsDefault)
        {
            await ClearDefaultAddressesAsync(customer.CustomerId);
            address.IsDefault = true;
        }

        address.Label = string.IsNullOrWhiteSpace(dto.Label) ? null : dto.Label.Trim();
        address.AddressLine = dto.AddressLine.Trim();
        address.City = dto.City.Trim();
        address.State = dto.State.Trim();
        address.Pincode = dto.Pincode.Trim();
        address.UpdatedAt = DateTime.Now;

        await SaveChangesAsync();

        return MapAddress(address);
    }
}