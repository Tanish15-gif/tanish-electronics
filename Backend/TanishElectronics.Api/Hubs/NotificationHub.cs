using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.Data;

namespace TanishElectronics.Api.Hubs;

[Authorize(Policy = AppPolicies.AdminOrCustomer)]
public class NotificationHub : Hub
{
    private readonly TanishElectronicsDbContext _dbContext;

    public NotificationHub(TanishElectronicsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public override async Task OnConnectedAsync()
    {
        var user = Context.User;

        if (user == null)
        {
            return;
        }

        if (!int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var currentUserId))
        { Context.Abort(); return; }
        var roles = await _dbContext.AppUserRoles.AsNoTracking()
            .Where(r => r.AppUserId == currentUserId && r.AppUser.IsActive && r.AppUser.DeletedAt == null)
            .Select(r => r.Role.RoleName).ToListAsync();
        var isAdmin = roles.Contains(RoleNames.Admin) || roles.Contains(RoleNames.Owner);

        if (isAdmin)
        {
            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                NotificationGroups.Admins
            );
        }

        var isCustomer = roles.Contains(RoleNames.Customer);

        if (isCustomer)
        {
            var appUserIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);

            if (int.TryParse(appUserIdClaim, out var appUserId))
            {
                var customerId = await _dbContext.Customers
                    .AsNoTracking()
                    .Where(customer =>
                        customer.AppUserId == appUserId &&
                        customer.DeletedAt == null &&
                        customer.IsActive
                    )
                    .Select(customer => (int?)customer.CustomerId)
                    .FirstOrDefaultAsync();

                if (customerId.HasValue)
                {
                    await Groups.AddToGroupAsync(
                        Context.ConnectionId,
                        NotificationGroups.Customer(customerId.Value)
                    );
                }
            }
        }

        await base.OnConnectedAsync();
    }
}

public static class NotificationGroups
{
    public const string Admins = "Admins";

    public static string Customer(int customerId)
    {
        return $"Customer_{customerId}";
    }
}
