using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Admin.Enquiries;
using TanishElectronics.Api.DTOs.Enquiries;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Authorize(Policy = AppPolicies.AdminOnly)]
[EnableRateLimiting(RateLimitPolicies.AdminAction)]
[Route("admin/enquiries")]
public class AdminEnquiriesController : ControllerBase
{
    private readonly IEnquiryService _enquiryService;
    private readonly ICurrentUserService _currentUserService;
    public AdminEnquiriesController(IEnquiryService enquiryService, ICurrentUserService currentUserService)
    {
        _enquiryService = enquiryService;
        _currentUserService = currentUserService;
    }


    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] AdminEnquiryQueryDto query)
    {
        var enquiries = await _enquiryService.GetAdminEnquiriesAsync(query);
        return Ok(enquiries);
    }


    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus([FromRoute] int id, [FromBody] UpdateEnquiryStatusDto dto)
    {
        var adminAppUserId = await _currentUserService.GetRequiredCurrentAppUserIdAsync();
        await _enquiryService.UpdateStatusAsync(id, dto, adminAppUserId);
        return Ok(new
        {
            message = "Enquiry Status Updated SuccessFully"
        });
    }


    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var enquiry = await _enquiryService.GetAdminEnquiryByIdAsync(id);
        return Ok(enquiry);
    }


    [HttpGet("{id:int}/notes")]
    public async Task<IActionResult> GetNotes(int id)
    {
        var notes = await _enquiryService.GetEnquiryNotesAsync(id);
        return Ok(notes);
    }


    [HttpPost("{id:int}/notes")]
    public async Task<IActionResult> AddNotes(int id, CreateEnquiryNoteDto dto)
    {
        var notes = await _enquiryService.AddEnquiryNoteAsync(id, dto);
        return Ok(notes);
    }
}