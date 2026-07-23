using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[AllowAnonymous]
[EnableRateLimiting(RateLimitPolicies.PublicRead)]
[Route("public/feedbacks")]
public class PublicFeedbacksController : ControllerBase
{
    private readonly IPublicRepairFeedbackService _service;
    public PublicFeedbacksController(IPublicRepairFeedbackService service)
    {
        _service = service;
    }
    [HttpGet]
    [OutputCache(Duration = 30, Tags = new[] { OutputCachePolicies.FeedbacksTag })]
    public async Task<IActionResult> GetPublicFeedbacks([FromQuery] int limit = 6)
    {
        var result = await _service.GetPublicFeedbacksAsync(limit);
        return Ok(result);
    }
}