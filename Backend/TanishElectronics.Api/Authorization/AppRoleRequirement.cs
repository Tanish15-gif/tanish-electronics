using Microsoft.AspNetCore.Authorization;

namespace TanishElectronics.Api.Authorization;

public class AppRoleRequirement : IAuthorizationRequirement
{
    public IReadOnlyList<string>? AllowRoles { get; }
    public AppRoleRequirement(params string[] allowRoles)
    {
        AllowRoles = allowRoles;
    }
}