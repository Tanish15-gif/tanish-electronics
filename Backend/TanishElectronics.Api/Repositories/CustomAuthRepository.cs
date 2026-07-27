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
        user.UpdatedAt = DateTime.UtcNow;

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
            .Include(token => token.UserSession)
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

    public async Task CreateCustomerProfileIfMissingAsync(AppUser appUser)
    {
        var exists = await _dbContext.Customers
        .AnyAsync(customer => customer.AppUserId == appUser.AppUserId);

        if (exists)
        {
            return;
        }

        _dbContext.Customers.Add(new Customer
        {
            AppUserId = appUser.AppUserId,
            FullName = appUser.FullName,
            PhoneNumber = string.IsNullOrWhiteSpace(appUser.PhoneNumber)
                ? "0000000000"
                : appUser.PhoneNumber,
            Email = appUser.Email,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });

        await _dbContext.SaveChangesAsync();
    }

    public async Task<ExternalLogin?> GetExternalLoginAsync(string provider, string providerUserId)
    {
        return await _dbContext.ExternalLogins
            .Include(externalLogin => externalLogin.AppUser)
                .ThenInclude(user => user.AppUserRoles)
                    .ThenInclude(userRole => userRole.Role)
            .FirstOrDefaultAsync(externalLogin =>
                externalLogin.Provider == provider &&
                externalLogin.ProviderUserId == providerUserId);
    }

    public async Task AddExternalLoginAsync(ExternalLogin externalLogin)
    {
        _dbContext.ExternalLogins.Add(externalLogin);

        await _dbContext.SaveChangesAsync();
    }


    #region OTP Repository

    public async Task<OtpCode?> GetLatestOtpAsync(string normalizedEmail, string purpose)
    {
        return await _dbContext.OtpCodes
            .AsNoTracking()
            .Where(opt =>
                opt.NormalizedEmail == normalizedEmail &&
                opt.Purpose == purpose
            )
            .OrderByDescending(otp => otp.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task AddOtpAsync(OtpCode otpCode)
    {
        _dbContext.OtpCodes.Add(otpCode);

        await _dbContext.SaveChangesAsync();
    }

    public async Task InvalidateActiveOtpsAsync(string normalizedEmail, string purpose)
    {
        var now = DateTime.UtcNow;

        var activeOtps = await _dbContext.OtpCodes
            .Where(otp =>
                otp.NormalizedEmail == normalizedEmail &&
                otp.Purpose == purpose &&
                otp.ConsumedAt == null
            )
            .ToListAsync();

        if (activeOtps.Count == 0) return;

        foreach (var otp in activeOtps)
        {
            otp.ConsumedAt = now;
        }
        await _dbContext.SaveChangesAsync();
    }

    public async Task<OtpCode?> GetLatestActiveOtpAsync(string normalizedEmail, string purpose)
    {
        return await _dbContext.OtpCodes
            .Where(otp =>
                otp.NormalizedEmail == normalizedEmail &&
                otp.Purpose == purpose &&
                otp.ConsumedAt == null
            )
            .OrderByDescending(otp => otp.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task UpdateOtpAsync(OtpCode otpCode)
    {
        _dbContext.OtpCodes.Update(otpCode);

        await _dbContext.SaveChangesAsync();
    }

    public async Task ConsumeOtpAndCreateResetSessionAsync(OtpCode otpCode, PasswordResetSession resetSession)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        try
        {
            var now = DateTime.UtcNow;

            var existingSessions = await _dbContext.PasswordResetSessions
                .Where(session =>
                    session.AppUserId == resetSession.AppUserId &&
                    session.ConsumedAt == null
                )
                .ToListAsync();

            foreach (var existingSession in existingSessions)
            {
                existingSession.ConsumedAt = now;
            }

            otpCode.ConsumedAt = now;

            _dbContext.OtpCodes.Update(otpCode);

            _dbContext.PasswordResetSessions.Add(resetSession);

            await _dbContext.SaveChangesAsync();

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<PasswordResetSession?> GetPasswordResetSessionByHashAsync(string tokenHash)
    {
        return await _dbContext.PasswordResetSessions
            .Include(session => session.AppUser)
            .FirstOrDefaultAsync(session =>
                session.TokenHash == tokenHash
            );
    }

    public async Task CompletePasswordResetAsync(AppUser user, PasswordResetSession resetSession, string? revokedByIp)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        try
        {
            var now = DateTime.UtcNow;

            user.UpdatedAt = now;
            resetSession.ConsumedAt = now;

            var activeSessions = await _dbContext.UserSessions
            .Where(session =>
                session.AppUserId == user.AppUserId &&
                session.RevokedAt == null
            )
            .ToListAsync();

            foreach (var session in activeSessions)
            {
                session.RevokedAt = now;
                session.RevokedByIp = revokedByIp;
            }

            var otherResetSessions = await _dbContext.PasswordResetSessions
                .Where(session =>
                    session.AppUserId == user.AppUserId &&
                    session.ConsumedAt == null &&
                    session.PasswordResetSessionId != resetSession.PasswordResetSessionId
                )
                .ToListAsync();

            foreach (var session in otherResetSessions)
            {
                session.ConsumedAt = now;
            }

            var activeRefreshTokens = await _dbContext.RefreshTokens
                .Where(token =>
                    token.AppUserId == user.AppUserId &&
                    token.RevokedAt == null
                )
                .ToListAsync();

            foreach (var refreshToken in activeRefreshTokens)
            {
                refreshToken.RevokedAt = now;
                refreshToken.RevokedByIp = revokedByIp;
            }

            await _dbContext.SaveChangesAsync();

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
    #endregion

    public async Task<AppUser?> GetUserByIdWithExternalLoginsAsync(int appUserId)
    {
        return await _dbContext.AppUsers
            .Include(user => user.ExternalLogins)
            .FirstOrDefaultAsync(user =>
                user.AppUserId == appUserId &&
                user.DeletedAt == null
            );
    }

    public async Task CompletePasswordChangeAsync(AppUser user, string? revokedByIp)
    {
        var now = DateTime.UtcNow;

        var activeSessions = await _dbContext.UserSessions
            .Where(session =>
            session.AppUserId == user.AppUserId &&
            session.RevokedAt == null
        )
        .ToListAsync();

        foreach (var session in activeSessions)
        {
            session.RevokedAt = now;
            session.RevokedByIp = revokedByIp;
        }

        var activeRefreshTokens = await _dbContext.RefreshTokens
            .Where(token =>
                token.AppUserId == user.AppUserId &&
                token.RevokedAt == null
            )
            .ToListAsync();

        foreach (var refreshToken in activeRefreshTokens)
        {
            refreshToken.RevokedAt = now;
            refreshToken.RevokedByIp = revokedByIp;
        }
        _dbContext.AppUsers.Update(user);

        await _dbContext.SaveChangesAsync();
    }

    #region Google Set Password

    public async Task CreatePasswordSetupSessionAsync(PasswordResetSession setupSession)
    {
        var now = DateTime.UtcNow;

        var existingSessions = await _dbContext.PasswordResetSessions
            .Where(session =>
                session.AppUserId == setupSession.AppUserId &&
                session.ConsumedAt == null
            )
            .ToListAsync();

        foreach (var session in existingSessions)
        {
            session.ConsumedAt = now;
        }

        _dbContext.PasswordResetSessions.Add(setupSession);

        await _dbContext.SaveChangesAsync();
    }

    public async Task CompletePasswordSetupAsync(AppUser user, PasswordResetSession setupSession)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        try
        {
            var now = DateTime.UtcNow;

            var affectedRows = await _dbContext.PasswordResetSessions
                .Where(session =>
                    session.PasswordResetSessionId == setupSession.PasswordResetSessionId &&
                    session.ConsumedAt == null &&
                    session.ExpiresAt > now
                )
                .ExecuteUpdateAsync(setters =>
                    setters.SetProperty(
                        session => session.ConsumedAt,
                        now
                    )
                );

            if (affectedRows != 1) throw new InvalidOperationException("Invalid or expired setup session.");

            _dbContext.AppUsers.Update(user);

            await _dbContext.SaveChangesAsync();

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
    #endregion


    #region Session Management

    public async Task<int> GetActiveSessionCountAsync(int appUserId)
    {
        var now = DateTime.UtcNow;

        return await _dbContext.RefreshTokens
            .CountAsync(token =>
                token.AppUserId == appUserId &&
                token.RevokedAt == null &&
                token.ExpiresAt > now
            );
    }

    public async Task RevokeOtherSessionsAsync(int appUserId, Guid currentSessionId, string? revokedByIp)
    {
        var now = DateTime.UtcNow;

        var otherSessions = await _dbContext.UserSessions
            .Where(session =>
                session.AppUserId == appUserId &&
                session.UserSessionId != currentSessionId &&
                session.RevokedAt == null
            )
            .ToListAsync();

        foreach (var session in otherSessions)
        {
            session.RevokedAt = now;
            session.RevokedByIp = revokedByIp;
        }

        var otherTokens = await _dbContext.RefreshTokens
            .Where(token =>
                token.AppUserId == appUserId &&
                token.UserSessionId != currentSessionId &&
                token.RevokedAt == null
            )
            .ToListAsync();

        foreach (var token in otherTokens)
        {
            token.RevokedAt = now;
            token.RevokedByIp = revokedByIp;
        }

        await _dbContext.SaveChangesAsync();
    }

    public async Task RevokeAllRefreshTokensAsync(int appUserId, string? revokedByIp)
    {
        var now = DateTime.UtcNow;

        var activeSessions = await _dbContext.UserSessions
            .Where(session =>
                session.RevokedAt == now &&
                session.RevokedAt == null
            )
            .ToListAsync();

        foreach (var session in activeSessions)
        {
            session.AppUserId = appUserId;
            session.RevokedByIp = revokedByIp;
        }

        var activeTokens = await _dbContext.RefreshTokens
            .Where(token =>
                token.AppUserId == appUserId &&
                token.RevokedAt == null
            )
            .ToListAsync();

        foreach (var token in activeTokens)
        {
            token.RevokedAt = now;
            token.RevokedByIp = revokedByIp;
        }

        await _dbContext.SaveChangesAsync();
    }

    public async Task<UserSession> AddUserSessionAsync(UserSession userSession)
    {
        _dbContext.UserSessions.Add(userSession);

        await _dbContext.SaveChangesAsync();

        return userSession;
    }

    public async Task TouchUserSessionAsync(Guid userSessionId, string? ipAddress)
    {
        var session = await _dbContext.UserSessions
            .FirstOrDefaultAsync(item =>
                item.UserSessionId == userSessionId &&
                item.RevokedAt == null
            );

        if (session == null) return;

        session.LastSeenAt = DateTime.UtcNow;


        if (!string.IsNullOrWhiteSpace(ipAddress)) session.IpAddress = ipAddress;

        await _dbContext.SaveChangesAsync();
    }

    public async Task<int> GetActiveUserSessionCountAsync(int appUserId)
    {
        return await _dbContext.UserSessions
            .CountAsync(session =>
                session.AppUserId == appUserId &&
                session.RevokedAt == null
            );
    }

    public async Task<List<UserSession>> GetActiveUserSessionsAsync(int appUserId)
    {
        var now = DateTime.UtcNow;
        return await _dbContext.UserSessions
            .AsNoTracking()
            .Where(session =>
                session.AppUserId == appUserId &&
                session.RevokedAt == null &&
                session.RefreshTokens.Any(token =>
                    token.RevokedAt == null &&
                    token.ExpiresAt > now
                )
            )
            .OrderByDescending(session => session.LastSeenAt)
            .ToListAsync();
    }

    public async Task<bool> RevokeUserSessionAsync(int appUserId, Guid userSessionId, string? revokedByIp)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        try
        {
            var session = await _dbContext.UserSessions
                .FirstOrDefaultAsync(item =>
                    item.UserSessionId == userSessionId &&
                    item.AppUserId == appUserId &&
                    item.RevokedAt == null
                );

            if (session == null) return false;

            var now = DateTime.UtcNow;

            session.RevokedAt = now;
            session.RevokedByIp = revokedByIp;

            var activeTokens = await _dbContext.RefreshTokens
                .Where(token =>
                    token.UserSessionId == userSessionId &&
                    token.AppUserId == appUserId &&
                    token.RevokedAt == null
                )
                .ToListAsync();

            foreach (var token in activeTokens)
            {
                token.RevokedAt = now;
                token.RevokedByIp = revokedByIp;
            }

            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    #endregion
}