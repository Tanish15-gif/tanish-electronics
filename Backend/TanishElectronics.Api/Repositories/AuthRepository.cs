using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;

namespace TanishElectronics.Api.Repositories;

public class AuthRepository : IAuthRepository
{
    private readonly TanishElectronicsDbContext _dbContext;

    public AuthRepository(TanishElectronicsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<AppUser?> GetAppUserByIdAsync(int appUserId)
    {
        return await _dbContext.AppUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(user =>
                user.AppUserId == appUserId &&
                user.IsActive &&
                user.DeletedAt == null
            );
    }

    public async Task<bool> AppUserHasRoleAsync(int appUserId, string roleName)
    {
        return await _dbContext.AppUserRoles
            .AsNoTracking()
            .AnyAsync(userRole =>
                userRole.AppUserId == appUserId &&
                userRole.Role.RoleName == roleName
            );
    }
}