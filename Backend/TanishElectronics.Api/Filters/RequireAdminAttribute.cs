using Microsoft.AspNetCore.Mvc;

namespace TanishElectronics.Api.Filters;

public class RequireAdminAttribute : TypeFilterAttribute
{
    public RequireAdminAttribute() : base(typeof(RequireAdminFilter))
    {

    }
}