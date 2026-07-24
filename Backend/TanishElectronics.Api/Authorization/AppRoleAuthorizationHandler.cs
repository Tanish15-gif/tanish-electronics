using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using TanishElectronics.Api.Interfaces.Repositories;

namespace TanishElectronics.Api.Authorization;

public class AppRoleAuthorizationHandler
    : AuthorizationHandler<AppRoleRequirement>
{
    private readonly IAuthRepository _authRepository;

    public AppRoleAuthorizationHandler(IAuthRepository authRepository)
    {
        _authRepository = authRepository;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        AppRoleRequirement requirement
    )
    {
        var appUserId = await ResolveAppUserIdAsync(context.User);

        if (appUserId == null)
        {
            return;
        }

        foreach (var role in requirement.AllowRoles!)
        {
            var hasRole = await _authRepository.AppUserHasRoleAsync(
                appUserId.Value,
                role
            );

            if (hasRole)
            {
                context.Succeed(requirement);
                return;
            }
        }
    }

    private async Task<int?> ResolveAppUserIdAsync(ClaimsPrincipal user)
    {
        var nameIdentifier = user.FindFirstValue(ClaimTypes.NameIdentifier);

        if (int.TryParse(nameIdentifier, out var customAppUserId))
        {
            return customAppUserId;
        }

        var clerkUserId =
            nameIdentifier ??
            user.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(clerkUserId))
        {
            return null;
        }

        return await _authRepository.GetAppUserIdByClerkIdAsync(clerkUserId);
    }
}