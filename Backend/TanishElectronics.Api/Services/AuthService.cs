using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Auth;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class AuthService : IAuthService
{
    private readonly IAuthRepository _repository;

    public AuthService(IAuthRepository repository)
    {
        _repository = repository;
    }

    public async Task<AuthUserDto> SyncUserAsync(string clerkUserId, SyncUserDto dto)
    {
        ValidateSyncUser(dto);

        var fullName = dto.FullName.Trim();
        var email = dto.Email.Trim();

        var phoneNumber = string.IsNullOrWhiteSpace(dto.PhoneNumber)
            ? null
            : dto.PhoneNumber.Trim();

        var existingUser = await _repository.GetAppUserByClerkIdAsync(clerkUserId);

        if (existingUser == null)
        {
            existingUser = await _repository.GetAppUserByEmailAsync(email);
        }

        if (existingUser == null)
        {
            existingUser = new AppUser
            {
                ClerkUserId = clerkUserId,
                FullName = fullName,
                Email = email,
                PhoneNumber = phoneNumber,
                IsActive = true,
                CreatedAt = DateTime.Now
            };

            await _repository.AddAppUserAsync(existingUser);
            await _repository.SaveChangesAsync();
        }
        else
        {
            existingUser.ClerkUserId = clerkUserId;
            existingUser.FullName = fullName;
            existingUser.Email = email;

            if (!string.IsNullOrWhiteSpace(phoneNumber))
            {
                existingUser.PhoneNumber = phoneNumber;
            }

            existingUser.IsActive = true;
            existingUser.DeletedAt = null;
            existingUser.UpdatedAt = DateTime.Now;

            await _repository.SaveChangesAsync();
        }

        var hasCustomerRole = await _repository.AppUserHasRoleAsync(
            existingUser.AppUserId,
            RoleNames.Customer
        );

        if (!hasCustomerRole)
        {
            var customerRoleId = await _repository.GetRoleIdByNameAsync(RoleNames.Customer);

            var appUserRole = new AppUserRole
            {
                AppUserId = existingUser.AppUserId,
                RoleId = customerRoleId,
                AssignedAt = DateTime.Now
            };

            await _repository.AddAppUserRoleAsync(appUserRole);
            await _repository.SaveChangesAsync();
        }

        var authUser = await _repository.GetAuthUserByClerkIdAsync(clerkUserId);

        if (authUser == null)
        {
            throw new InvalidOperationException("Unable to sync user.");
        }

        return authUser;
    }

    public async Task<AuthUserDto> GetCurrentUserAsync(string clerkUserId)
    {
        var authUser = await _repository.GetAuthUserByClerkIdAsync(clerkUserId);

        if (authUser == null)
        {
            throw new KeyNotFoundException("User was not found in application database.");
        }

        return authUser;
    }

    private static void ValidateSyncUser(SyncUserDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName))
        {
            throw new InvalidOperationException("Full name is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            throw new InvalidOperationException("Email is required.");
        }
    }
}