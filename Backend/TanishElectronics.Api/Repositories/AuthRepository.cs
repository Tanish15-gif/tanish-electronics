using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Auth;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;

namespace TanishElectronics.Api.Repositories;

public class AuthRepository : IAuthRepository
{
    private readonly TanishElectronicsDbContext _context;

    public AuthRepository(TanishElectronicsDbContext context)
    {
        _context = context;
    }

    public async Task<AppUser?> GetAppUserByClerkIdAsync(string clerkUserId)
    {
        return await _context.AppUsers
            .FirstOrDefaultAsync(user =>
                user.ClerkUserId == clerkUserId &&
                user.DeletedAt == null);
    }

    public async Task<int> GetRoleIdByNameAsync(string roleName)
    {
        var role = await _context.Roles
            .FirstOrDefaultAsync(role => role.RoleName == roleName);

        if (role == null)
        {
            throw new InvalidOperationException($"Role '{roleName}' was not found.");
        }

        return role.RoleId;
    }

    public async Task AddAppUserAsync(AppUser appUser)
    {
        await _context.AppUsers.AddAsync(appUser);
    }

    public async Task AddAppUserRoleAsync(AppUserRole appUserRole)
    {
        await _context.AppUserRoles.AddAsync(appUserRole);
    }

    public async Task<AuthUserDto?> GetAuthUserByClerkIdAsync(string clerkUserId)
    {
        var user = await _context.AppUsers
            .Where(user =>
                user.ClerkUserId == clerkUserId &&
                user.DeletedAt == null)
            .Select(user => new AuthUserDto
            {
                AppUserId = user.AppUserId,
                ClerkUserId = user.ClerkUserId,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return null;
        }

        user.Roles = await (
            from appUserRole in _context.AppUserRoles
            join role in _context.Roles
                on appUserRole.RoleId equals role.RoleId
            where appUserRole.AppUserId == user.AppUserId
            select role.RoleName
        ).ToListAsync();

        return user;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    public async Task<AppUser?> GetAppUserByEmailAsync(string email)
    {
        return await _context.AppUsers
            .FirstOrDefaultAsync(user =>
                user.Email == email &&
                user.DeletedAt == null
            );
    }

    public async Task<bool> AppUserHasRoleAsync(int appUserId, string roleName)
    {
        return await (
            from appUserRole in _context.AppUserRoles
            join role in _context.Roles
                on appUserRole.RoleId equals role.RoleId
            where appUserRole.AppUserId == appUserId &&
                role.RoleName == roleName
            select appUserRole
        ).AnyAsync();
    }

    public async Task<int?> GetAppUserIdByClerkIdAsync(string clerkUserId)
    {
        return await _context.AppUsers
            .AsNoTracking()
            .Where(user => user.ClerkUserId == clerkUserId &&
                    user.DeletedAt == null)
            .Select(user => user.AppUserId)
            .FirstOrDefaultAsync();
    }
}