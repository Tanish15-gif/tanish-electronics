using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TanishElectronics.Api.Constants;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Route("auth/custom/test")]
public class CustomAuthTestController : ControllerBase
{
    [HttpGet("me")]
    [Authorize(AuthenticationSchemes = AuthSchemes.CustomJwt)]
    public IActionResult Me()
    {
        return Ok(new
        {
            message = "Custom JWT is working.",
            claims = User.Claims.Select(claim => new
            {
                claim.Type,
                claim.Value
            })
        });
    }
}