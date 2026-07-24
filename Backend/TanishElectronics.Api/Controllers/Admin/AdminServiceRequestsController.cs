using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Admin.ServiceRequests;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Authorize(Policy = AppPolicies.AdminOnly)]
[EnableRateLimiting(RateLimitPolicies.AdminAction)]
[Route("admin/service-requests")]
public class AdminServiceRequestsController : ControllerBase
{
    private readonly IServiceRequestService _serviceRequestService;
    public AdminServiceRequestsController(IServiceRequestService serviceRequestService)
    {
        _serviceRequestService = serviceRequestService;
    }
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] AdminServiceRequestQueryDto query)
    {
        var requests = await _serviceRequestService.GetAdminServiceRequestsAsync(query);
        return Ok(requests);
    }


    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var request = await _serviceRequestService.GetAdminServiceRequestByIdAsync(id);
        return Ok(request);
    }


    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateServiceRequestStatusDto dto)
    {
        await _serviceRequestService.UpdateStatusAsync(id, dto);
        return Ok(new
        {
            message = "Service request status Updated SuccessFully"
        });
    }


    [HttpPut("{id:int}/pricing")]
    public async Task<IActionResult> UpdatePricing(int id, UpdateServiceRequestPricingDto dto)
    {
        await _serviceRequestService.UpdateServiceRequestPricingAsync(id, dto);
        return Ok(new
        {
            message = "Pricing and notes updated successfully."
        });
    }


    [HttpPut("{id:int}/repair-work-notes")]
    public async Task<IActionResult> UpdateRepairWorkNotes(int id, [FromBody] UpdateRepairWorkNotesDto dto)
    {
        await _serviceRequestService.UpdateRepairWorkNotesAsync(id, dto);

        return Ok(new
        {
            message = "Repair work notes updated successfully."
        });
    }
}