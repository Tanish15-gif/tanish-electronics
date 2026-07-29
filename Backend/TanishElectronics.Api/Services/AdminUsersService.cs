using TanishElectronics.Api.DTOs.Admin.Users;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.Exceptions;
using TanishElectronics.Api.Interfaces.Common;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class AdminUsersService : IAdminUsersService
{
    private readonly IAdminUsersRepository _usersRepository;
    private readonly ICurrentUserContext _currentUserContext;
    private readonly IAuditLogService _auditLogService;
    public AdminUsersService
    (
        IAdminUsersRepository usersRepository,
        ICurrentUserContext currentUserContext,
        IAuditLogService auditLogService
    )
    {
        _usersRepository = usersRepository;
        _currentUserContext = currentUserContext;
        _auditLogService = auditLogService;
    }
    public Task<AdminUsersSummaryDto> GetSummaryAsync()
    {
        return _usersRepository.GetSummaryAsync();
    }

    public async Task<PagedResultDto<AdminUserListItemDto>> GetUsersAsync(AdminUsersQueryDto query)
    {
        query.Page = Math.Max(1, query.Page);

        query.PageSize = Math.Clamp(
            query.PageSize,
            1,
            50
        );

        var allowedStatuses = new[]
        {
            "all",
            "active",
            "inactive",
            "locked"
        };

        if (
            !string.IsNullOrWhiteSpace(query.Status) &&
            !allowedStatuses.Contains(
                query.Status.Trim().ToLowerInvariant()
            )
        )
        {
            throw new BadRequestException(
                "Invalid user-status filter."
            );
        }

        var allowedSignInMethods = new[]
        {
            "all",
            "password",
            "google",
            "both"
        };

        if (
            !string.IsNullOrWhiteSpace(
                query.SignInMethod
            ) &&
            !allowedSignInMethods.Contains(
                query.SignInMethod
                    .Trim()
                    .ToLowerInvariant()
            )
        )
        {
            throw new BadRequestException(
                "Invalid sign-in-method filter."
            );
        }

        return await _usersRepository.GetUsersAsync(query);
    }

    public async Task<AdminUserDetailsDto> GetUserDetailsAsync(int appUserId)
    {
        if (appUserId <= 0) throw new BadRequestException("Invalid user identifier");

        var user = await _usersRepository.GetUserDetailsAsync(appUserId);

        if (user == null) throw new KeyNotFoundException("User account was not found");

        return user;
    }

    public async Task SetUserActiveStatusAsync(int appUserId, bool isActive)
    {
        if (appUserId <= 0) throw new BadRequestException("Invalid user identifier.");

        var currentAdminUserId = _currentUserContext.UserId;

        if (appUserId == currentAdminUserId && !isActive) throw new BadRequestException("You cannot deactivate your own account.");

        var updated = await _usersRepository.SetUserActiveStatusAsync(appUserId, isActive, _currentUserContext.IpAddress);

        string action = isActive ? "User Activated" : "User Deactivated";

        await _auditLogService.LogAsync(
            _currentUserContext.UserId,
            action,
            "User Management",
            null,
            $"{action} user account of user Id: {appUserId}"
        );

        if (!updated) throw new KeyNotFoundException("User account was not found.");
    }

    public async Task UnlockUserAsync(int appUserId)
    {
        if (appUserId <= 0) throw new BadRequestException("Invalid user identifier.");

        var updated = await _usersRepository.UnlockUserAsync(appUserId);

        if (!updated) throw new KeyNotFoundException("User account was not found.");
    }

    public async Task RevokeAllUserSessionsAsync(int appUserId)
    {
        if (appUserId <= 0) throw new BadRequestException("Invalid user identifier.");

        var currentAdminUserId = _currentUserContext.UserId;

        if (appUserId == currentAdminUserId) throw new BadRequestException("You cannot revoke your own sessions from this page.");

        var updated = await _usersRepository.RevokeAllUserSessionsAsync(appUserId, _currentUserContext.IpAddress);

        if (!updated) throw new KeyNotFoundException("User account was not found.");
    }
}