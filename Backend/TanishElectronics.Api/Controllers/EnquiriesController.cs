using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Enquiries;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class EnquiriesController : ControllerBase
{
    private readonly IEnquiryService _enquiryService;
    public EnquiriesController(IEnquiryService enquiryService)
    {
        _enquiryService = enquiryService;
    }

    [EnableRateLimiting(RateLimitPolicies.FormSubmit)]
    [HttpPost]
    public async Task<IActionResult> Create(CreateEnquiryDto dto)
    {
        var result = await _enquiryService.CreateAsync(dto);
        return Ok(result);
    }
}