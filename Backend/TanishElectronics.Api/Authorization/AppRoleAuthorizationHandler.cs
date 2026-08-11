using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using TanishElectronics.Api.Interfaces.Repositories;

namespace TanishElectronics.Api.Authorization;

public class AppRoleAuthorizationHandler : AuthorizationHandler<AppRoleRequirement>
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
        var appUserIdValue =
            context.User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            context.User.FindFirstValue("sub");

        if (!int.TryParse(appUserIdValue, out var appUserId))
        {
            return;
        }

        foreach (var role in requirement.AllowRoles!)
        {
            var hasRole = await _authRepository.AppUserHasRoleAsync(
                appUserId,
                role
            );

            if (hasRole)
            {
                context.Succeed(requirement);
                return;
            }
        }
    }
}