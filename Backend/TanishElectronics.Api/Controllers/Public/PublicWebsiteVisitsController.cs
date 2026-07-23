using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Public;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[AllowAnonymous]
[EnableRateLimiting(RateLimitPolicies.FormSubmit)]
[Route("public/website-visits")]
public class PublicWebsiteVisitsController : ControllerBase
{
    private readonly IWebsiteVisitService _visitService;

    public PublicWebsiteVisitsController(IWebsiteVisitService visitService)
    {
        _visitService = visitService;
    }

    [HttpPost]
    public async Task<IActionResult> TrackVisit([FromBody] CreateWebsiteVisitDto dto)
    {
        await _visitService.TrackVisitAsync(dto);

        return Ok(new { message = "Visit tracked successfully." });
    }
}