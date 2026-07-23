using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Admin.Feedback;
using TanishElectronics.Api.Filters;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Authorize(Policy = AppPolicies.AdminOnly)]
[EnableRateLimiting(RateLimitPolicies.AdminAction)]
[Route("admin/feedbacks")]
public class AdminRepairFeedbacksController : ControllerBase
{
    private readonly IAdminRepairFeedbackService _service;
    public AdminRepairFeedbacksController(IAdminRepairFeedbackService service)
    {
        _service = service;
    }


    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] AdminFeedbackQueryDto query)
    {
        var feedbacks = await _service.GetAllAsync(query);
        return Ok(feedbacks);
    }


    [HttpPut("{feedbackId:int}/public-status")]
    public async Task<IActionResult> UpdatePublicStatus(int feedbackId, [FromBody] UpdateFeedbackPublicStatusDto dto)
    {
        await _service.UpdatePublicStatusAsync(feedbackId, dto);

        return Ok(new
        {
            message = "Feedback public status updated successfully."
        });
    }
}