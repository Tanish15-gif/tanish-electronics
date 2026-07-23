using Microsoft.AspNetCore.Mvc;
using TanishElectronics.Api.Interfaces.Services;
using TanishElectronics.Api.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class LookUpsController : ControllerBase
{
    private readonly ILookUpService _lookUpService;
    public LookUpsController(ILookUpService lookUpService)
    {
        _lookUpService = lookUpService;
    }
    [HttpGet("service-categories")]
    public async Task<IActionResult> GetServiceCategories()
    {
        var categories = await _lookUpService.GetServiceCategoriesAsync();
        return Ok(categories);
    }
    [HttpGet("service-locations")]
    public async Task<IActionResult> GetServiceLocations()
    {
        var locations = await _lookUpService.GetServiceLocationAsync();
        return Ok(locations);
    }
    [HttpGet("service-statuses")]
    public async Task<IActionResult> GetServiceStatuses()
    {
        var status = await _lookUpService.GetServiceStatusesAsync();
        return Ok(status);
    }
    [HttpGet("enquiry-statuses")]
    public async Task<IActionResult> GetEnquiryStatuses()
    {
        var statuses = await _lookUpService.GetEnquiryStatusesAsync();
        return Ok(statuses);
    }
    [HttpGet("product-categories")]
    public async Task<IActionResult> GetProductCategories()
    {
        var categories = await _lookUpService.GetProductCategoriesAsync();
        return Ok(categories);
    }
    [HttpGet("product-conditions")]
    public async Task<IActionResult> GetProductConditions()
    {
        var conditions = await _lookUpService.GetProductConditionsAsync();
        return Ok(conditions);
    }
}