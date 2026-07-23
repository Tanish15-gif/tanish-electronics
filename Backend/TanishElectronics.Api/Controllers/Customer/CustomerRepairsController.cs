using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Customer.Repairs;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Authorize(Policy = AppPolicies.CustomerOnly)]
[Route("CustomerRepairs")]
public class CustomerRepairsController : ControllerBase
{
    private readonly ICustomerRepairsService _service;

    public CustomerRepairsController(ICustomerRepairsService service)
    {
        _service = service;
    }

    [HttpGet("feedbacks")]
    public async Task<IActionResult> GetFeedbackCenter()
    {
        var result = await _service.GetFeedbackCenterAsync();
        return Ok(result);
    }

    [HttpGet("{serviceRequestId:int}")]
    public async Task<IActionResult> GetRepairDetails([FromRoute(Name = "serviceRequestId")] int serviceRequestId)
    {
        var result = await _service.GetRepairDetailsAsync(serviceRequestId);
        return Ok(result);
    }
    [HttpGet("{serviceRequestId:int}/feedback")]
    public async Task<IActionResult> GetFeedback([FromRoute(Name = "serviceRequestId")] int serviceRequestId)
    {
        var result = await _service.GetFeedbackAsync(serviceRequestId);
        return Ok(result);
    }

    [HttpPost("{serviceRequestId:int}/feedback")]
    public async Task<IActionResult> UpsertFeedback
    (
        [FromRoute(Name = "serviceRequestId")] int serviceRequestId,
        [FromBody] UpsertCustomerRepairFeedbackDto dto
    )
    {
        var result = await _service.UpsertFeedbackAsync(serviceRequestId, dto);
        return Ok(result);
    }
}