using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;
using TanishElectronics.Api.Data;
using System.Security.Claims;
using TanishElectronics.Api.Constants;
using Microsoft.EntityFrameworkCore;

namespace TanishElectronics.Api.Filters;

public class RequireAdminFilter : IAsyncAuthorizationFilter
{
    private readonly TanishElectronicsDbContext _dbContext;
    public RequireAdminFilter(TanishElectronicsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var httpUser = context.HttpContext.User;

        if (httpUser.Identity?.IsAuthenticated != true)
        {
            context.Result = new UnauthorizedObjectResult(new
            {
                message = "Authentication is required."
            });

            return;
        }
        var clerkUserId =
            httpUser.FindFirstValue("sub") ??
            httpUser.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(clerkUserId))
        {
            context.Result = new UnauthorizedObjectResult(new
            {
                message = "Invalid authentication token."
            });

            return;
        }

        var isAdmin = await (
            from appUser in _dbContext.AppUsers
            join appUserRole in _dbContext.AppUserRoles
                on appUser.AppUserId equals appUserRole.AppUserId
            join role in _dbContext.Roles
                on appUserRole.RoleId equals role.RoleId
            where appUser.ClerkUserId == clerkUserId
                  && appUser.IsActive
                  && appUser.DeletedAt == null
                  && (
                      role.RoleName == RoleNames.Owner ||
                      role.RoleName == RoleNames.Admin
                  )
            select appUser
        ).AnyAsync();

        if (!isAdmin)
        {
            context.Result = new ForbidResult();
        }
    }
}