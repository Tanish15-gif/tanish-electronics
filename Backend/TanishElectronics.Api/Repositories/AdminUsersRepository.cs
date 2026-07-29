using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Admin.Users;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;

namespace TanishElectronics.Api.Repositories;

public class AdminUsersRepository : IAdminUsersRepository
{
    private readonly TanishElectronicsDbContext _dbContext;
    public AdminUsersRepository(TanishElectronicsDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<AdminUsersSummaryDto> GetSummaryAsync()
    {
        var now = DateTime.UtcNow;

        var users =
            _dbContext.AppUsers
                .AsNoTracking()
                .Where(user => user.DeletedAt == null);

        return new AdminUsersSummaryDto
        {
            TotalUsers =
                await users.CountAsync(),

            ActiveUsers =
                await users.CountAsync(user =>
                    user.IsActive
                ),

            InactiveUsers =
                await users.CountAsync(user =>
                    !user.IsActive
                ),

            LockedUsers =
                await users.CountAsync(user =>
                    user.LockoutEndAt != null &&
                    user.LockoutEndAt > now
                ),

            GoogleUsers =
                await users.CountAsync(user =>
                    user.ExternalLogins.Any(login =>
                        login.Provider == "Google"
                    )
                ),

            PasswordUsers =
                await users.CountAsync(user =>
                    user.PasswordHash != null
                ),

            ActiveSessions =
                await _dbContext.UserSessions
                    .AsNoTracking()
                    .CountAsync(session =>
                        session.RevokedAt == null
                    )
        };
    }

    public async Task<PagedResultDto<AdminUserListItemDto>> GetUsersAsync(AdminUsersQueryDto query)
    {
        var now = DateTime.UtcNow;

        IQueryable<AppUser> users =
            _dbContext.AppUsers
                .AsNoTracking()
                .Where(user => user.DeletedAt == null);

        // Search
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            var normalizedSearch = search.ToUpperInvariant();

            users = users.Where(user =>
                user.FullName.Contains(search) ||
                user.NormalizedEmail!.Contains(normalizedSearch) ||
                (
                    user.PhoneNumber != null &&
                    user.PhoneNumber.Contains(search)
                )
            );
        }

        if (!string.IsNullOrWhiteSpace(query.Role))
        {
            var role = query.Role.Trim();

            users = users.Where(user =>
                user.AppUserRoles.Any(userRole =>
                    userRole.Role.RoleName == role
                )
            );
        }

        switch (query.Status?.Trim().ToLowerInvariant())
        {
            case "active":
                users = users.Where(user =>
                    user.IsActive &&
                    (
                        user.LockoutEndAt == null ||
                        user.LockoutEndAt <= now
                    )
                );
                break;

            case "inactive":
                users = users.Where(user =>
                    !user.IsActive
                );
                break;

            case "locked":
                users = users.Where(user =>
                    user.LockoutEndAt != null &&
                    user.LockoutEndAt > now
                );
                break;
        }

        switch (query.SignInMethod?
            .Trim()
            .ToLowerInvariant())
        {
            case "password":
                users = users.Where(user =>
                    user.PasswordHash != null &&
                    !user.ExternalLogins.Any()
                );
                break;

            case "google":
                users = users.Where(user =>
                    user.PasswordHash == null &&
                    user.ExternalLogins.Any(login =>
                        login.Provider == "Google"
                    )
                );
                break;

            case "both":
                users = users.Where(user =>
                    user.PasswordHash != null &&
                    user.ExternalLogins.Any(login =>
                        login.Provider == "Google"
                    )
                );
                break;
        }

        if (query.EmailConfirmed.HasValue)
        {
            users = users.Where(user =>
                user.EmailConfirmed ==
                query.EmailConfirmed.Value
            );
        }

        var totalItems = await users.CountAsync();

        var descending =
            !string.Equals(
                query.SortDirection,
                "asc",
                StringComparison.OrdinalIgnoreCase
            );

        users = query.SortBy.Trim().ToLowerInvariant() switch
        {
            "oldest" => users.OrderBy(user => user.CreatedAt),

            "name" when descending => users.OrderByDescending(user => user.FullName),

            "name" => users.OrderBy(user => user.FullName),

            "email" when descending => users.OrderByDescending(user => user.Email),

            "email" => users.OrderBy(user => user.Email),

            "lastlogin" when descending => users.OrderByDescending(user => user.LastLoginAt),

            "lastlogin" => users.OrderBy(user => user.LastLoginAt),

            "sessions" when descending => users.OrderByDescending(user =>
                    user.UserSessions.Count(session => session.RevokedAt == null)),

            "sessions" => users.OrderBy(user =>
                    user.UserSessions.Count(session => session.RevokedAt == null)),

            _ => users.OrderByDescending(user => user.CreatedAt)
        };

        var items = await users
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(user => new AdminUserListItemDto
            {
                AppUserId = user.AppUserId,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                ProfileImageUrl = user.ProfileImageUrl,

                EmailConfirmed = user.EmailConfirmed,
                IsActive = user.IsActive,

                IsLocked =
                    user.LockoutEndAt != null &&
                    user.LockoutEndAt > now,

                LockoutEndAt = user.LockoutEndAt,

                HasPassword =
                    user.PasswordHash != null,

                ConnectedProviders =
                    user.ExternalLogins
                        .Select(login => login.Provider)
                        .Distinct()
                        .OrderBy(provider => provider)
                        .ToList(),

                Roles =
                    user.AppUserRoles
                        .Select(userRole =>
                            userRole.Role.RoleName
                        )
                        .OrderBy(role => role)
                        .ToList(),

                ActiveSessionCount =
                    user.UserSessions.Count(session =>
                        session.RevokedAt == null
                    ),

                LastLoginAt = user.LastLoginAt,
                LastSeenAt = user.LastSeenAt,
                CreatedAt = user.CreatedAt
            })
            .ToListAsync();

        var totalPages = totalItems == 0
            ? 0
            : (int)Math.Ceiling(
                totalItems / (double)query.PageSize
            );

        return new PagedResultDto<AdminUserListItemDto>
        {
            Items = items,
            PageNumber = query.Page,
            PageSize = query.PageSize,
            TotalRecords = totalItems,
            TotalPages = totalPages
        };
    }

    public async Task<AdminUserDetailsDto?> GetUserDetailsAsync(int appUserId)
    {
        var now = DateTime.UtcNow;

        return await _dbContext.AppUsers
            .AsNoTracking()
            .Where(user =>
                user.AppUserId == appUserId &&
                user.DeletedAt == null
            )
            .Select(user => new AdminUserDetailsDto
            {
                AppUserId = user.AppUserId,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                ProfileImageUrl = user.ProfileImageUrl,

                Roles = user.AppUserRoles
                .Select(userRole =>
                    userRole.Role.RoleName
                )
                .OrderBy(role => role)
                .ToList(),

                ConnectedProviders = user.ExternalLogins
                .Select(login => login.Provider)
                .Distinct()
                .OrderBy(provider => provider)
                .ToList(),

                HasPassword =
                user.PasswordHash != null,

                EmailConfirmed =
                user.EmailConfirmed,

                IsActive =
                user.IsActive,

                IsLocked =
                user.LockoutEndAt != null &&
                user.LockoutEndAt > now,

                AccessFailedCount =
                user.AccessFailedCount,

                LockoutEndAt =
                user.LockoutEndAt,

                ActiveSessionCount =
                user.UserSessions.Count(session =>
                    session.RevokedAt == null
                ),

                PasswordUpdatedAt =
                user.PasswordUpdatedAt,

                LastLoginAt =
                user.LastLoginAt,

                LastSeenAt =
                user.LastSeenAt,

                LastLogoutAt =
                user.LastLogoutAt,

                CreatedAt =
                user.CreatedAt,

                UpdatedAt =
                user.UpdatedAt,

                ActiveSessions = user.UserSessions
                    .Where(session =>
                        session.RevokedAt == null
                    )
                    .OrderByDescending(session => session.LastSeenAt)
                    .Select(session => new AdminUserSessionDto
                    {
                        UserSessionId =
                            session.UserSessionId,

                        DeviceType =
                            session.DeviceType,

                        DeviceName =
                            session.DeviceName,

                        BrowserName =
                            session.BrowserName,

                        BrowserVersion =
                            session.BrowserVersion,

                        OperatingSystem =
                            session.OperatingSystem,

                        IpAddress =
                            session.IpAddress,

                        CreatedAt =
                            session.CreatedAt,

                        LastSeenAt =
                            session.LastSeenAt
                    }).ToList()
            }).FirstOrDefaultAsync();
    }

    public async Task<bool> SetUserActiveStatusAsync(int appUserId, bool isActive, string? revokedByIp)
    {
        var user = await _dbContext.AppUsers
            .FirstOrDefaultAsync(user =>
                user.AppUserId == appUserId &&
                user.DeletedAt == null
            );

        if (user == null) return false;

        var now = DateTime.UtcNow;

        user.IsActive = isActive;
        user.UpdatedAt = now;

        if (!isActive)
        {
            var sessions = await _dbContext.UserSessions
                .Where(session =>
                    session.AppUserId == appUserId &&
                    session.RevokedAt == null
                )
                .ToListAsync();

            foreach (var session in sessions)
            {
                session.RevokedAt = now;
                session.RevokedByIp = revokedByIp;
            }

            var refreshTokens = await _dbContext.RefreshTokens
                .Where(token =>
                    token.AppUserId == appUserId &&
                    token.RevokedAt == null
                )
                .ToListAsync();

            foreach (var token in refreshTokens)
            {
                token.RevokedAt = now;
                token.RevokedByIp = revokedByIp;
            }
        }
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UnlockUserAsync(int appUserId)
    {
        var user = await _dbContext.AppUsers
        .FirstOrDefaultAsync(user =>
            user.AppUserId == appUserId &&
            user.DeletedAt == null
        );

        if (user == null)
        {
            return false;
        }

        user.LockoutEndAt = null;
        user.AccessFailedCount = 0;
        user.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<bool> RevokeAllUserSessionsAsync(int appUserId, string? revokedByIp)
    {
        var userExists = await _dbContext.AppUsers
        .AnyAsync(user =>
            user.AppUserId == appUserId &&
            user.DeletedAt == null
        );

        if (!userExists)
        {
            return false;
        }

        var now = DateTime.UtcNow;

        var sessions = await _dbContext.UserSessions
            .Where(session =>
                session.AppUserId == appUserId &&
                session.RevokedAt == null
            )
            .ToListAsync();

        foreach (var session in sessions)
        {
            session.RevokedAt = now;
            session.RevokedByIp = revokedByIp;
        }

        var refreshTokens = await _dbContext.RefreshTokens
            .Where(token =>
                token.AppUserId == appUserId &&
                token.RevokedAt == null
            )
            .ToListAsync();

        foreach (var token in refreshTokens)
        {
            token.RevokedAt = now;
            token.RevokedByIp = revokedByIp;
        }

        await _dbContext.SaveChangesAsync();

        return true;
    }
}