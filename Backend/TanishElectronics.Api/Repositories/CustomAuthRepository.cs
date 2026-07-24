using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;

namespace TanishElectronics.Api.Repositories;

public class CustomAuthRepository : ICustomAuthRepository
{
    private readonly TanishElectronicsDbContext _dbContext;
    public CustomAuthRepository(TanishElectronicsDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<AppUser?> GetUserByNormalizedEmailAsync(string normalizedEmail)
    {
        return await _dbContext.AppUsers
            .Include(user => user.AppUserRoles)
                .ThenInclude(userRole => userRole.Role)
            .FirstOrDefaultAsync(user =>
                user.NormalizedEmail == normalizedEmail &&
                user.DeletedAt == null);
    }

    public async Task<bool> EmailExistsAsync(string normalizedEmail)
    {
        return await _dbContext.AppUsers
            .AsNoTracking()
            .AnyAsync(user =>
                user.NormalizedEmail == normalizedEmail &&
                user.DeletedAt == null);
    }

    public async Task<AppUser> CreateUserAsync(AppUser user)
    {
        _dbContext.AppUsers.Add(user);
        await _dbContext.SaveChangesAsync();

        return user;
    }

    public async Task AssignRoleAsync(int appUserId, string roleName)
    {
        var role = await _dbContext.Roles
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.RoleName == roleName);

        if (role == null)
        {
            throw new InvalidOperationException($"Role '{roleName}' was not found.");
        }

        var alreadyAssigned = await _dbContext.AppUserRoles
            .AnyAsync(item =>
                item.AppUserId == appUserId &&
                item.RoleId == role.RoleId
            );

        if (alreadyAssigned)
        {
            return;
        }

        _dbContext.AppUserRoles.Add(new AppUserRole
        {
            AppUserId = appUserId,
            RoleId = role.RoleId,
            AssignedAt = DateTime.UtcNow
        });

        await _dbContext.SaveChangesAsync();
    }

    public async Task<List<string>> GetUserRolesAsync(int appUserId)
    {
        return await _dbContext.AppUserRoles
            .AsNoTracking()
            .Where(userRole => userRole.AppUserId == appUserId)
            .Select(userRole => userRole.Role.RoleName)
            .ToListAsync();
    }

    public async Task AddRefreshTokenAsync(RefreshToken refreshToken)
    {
        _dbContext.RefreshTokens.Add(refreshToken);

        await _dbContext.SaveChangesAsync();
    }

    public async Task UpdateUserAsync(AppUser user)
    {
        user.CreatedAt = DateTime.UtcNow;

        _dbContext.AppUsers.Update(user);

        await _dbContext.SaveChangesAsync();
    }

    public async Task AddAuthEventAsync(UserAuthEvent authEvent)
    {
        _dbContext.UserAuthEvents.Add(authEvent);

        await _dbContext.SaveChangesAsync();
    }

    public async Task<RefreshToken?> GetRefreshTokenByHashAsync(string tokenHash)
    {
        return await _dbContext.RefreshTokens
            .Include(token => token.AppUser)
                .ThenInclude(user => user.AppUserRoles)
                    .ThenInclude(userRole => userRole.Role)
            .FirstOrDefaultAsync(token => token.TokenHash == tokenHash);
    }

    public async Task RevokeRefreshTokenAsync(RefreshToken refreshToken, string? revokedByIp, string replacedByTokenHash = null!)
    {
        refreshToken.RevokedAt = DateTime.UtcNow;
        refreshToken.RevokedByIp = revokedByIp;
        refreshToken.ReplacedByTokenHash = replacedByTokenHash;

        await _dbContext.SaveChangesAsync();
    }
}