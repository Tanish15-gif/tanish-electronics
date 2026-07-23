using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Admin.Announcements;
using TanishElectronics.Api.Filters;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[AllowAnonymous]
[EnableRateLimiting(RateLimitPolicies.PublicRead)]
[Route("public/announcements")]
public class PublicAnnouncementsController : ControllerBase
{
    private readonly IAnnouncementService _service;
    public PublicAnnouncementsController(IAnnouncementService service)
    {
        _service = service;
    }

    [HttpGet]
    [OutputCache(Duration = 30, Tags = new[] { OutputCachePolicies.AnnouncementsTag })]
    public async Task<IActionResult> GetPublicAnnouncements
    (
        [FromQuery] string location = "Homepage",
        [FromQuery] string audience = "All",
        [FromQuery] int limit = 3
    )
    {
        var result = await _service.GetPublicAnnouncementAsync(location, audience, limit);

        return Ok(result);
    }
}