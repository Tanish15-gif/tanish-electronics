using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.ServiceRequests;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class ServiceRequestsController : ControllerBase
{
    private readonly IServiceRequestService _serviceRequest;
    public ServiceRequestsController(IServiceRequestService serviceRequest)
    {
        _serviceRequest = serviceRequest;
    }

    [EnableRateLimiting(RateLimitPolicies.FormSubmit)]
    [HttpPost]
    public async Task<IActionResult> Create(CreateServiceRequestDto dto)
    {
        var result = await _serviceRequest.CreateAsync(dto);
        return Ok(result);
    }

    [HttpGet("track")]
    public async Task<IActionResult> Track([FromQuery] TrackServiceRequestDto dto)
    {
        var result = await _serviceRequest.TrackAsync(dto);
        return Ok(result);
    }


    [EnableRateLimiting(RateLimitPolicies.ImageUpload)]
    [HttpPost("{serviceRequestId:int}/images")]
    [RequestSizeLimit(30_000_000)]
    public async Task<IActionResult> UploadServiceRequestImage(int serviceRequestId, [FromForm] List<IFormFile> images)
    {
        var result = await _serviceRequest.UploadImageAsync(serviceRequestId, images);
        return Ok(result);
    }
}