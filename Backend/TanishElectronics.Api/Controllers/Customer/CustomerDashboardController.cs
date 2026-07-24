using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Authorize(Policy = AppPolicies.CustomerOnly)]
[Route("[controller]")]
public class CustomerDashboardController : ControllerBase
{
    private readonly ICustomerDashboardService _service;
    public CustomerDashboardController(ICustomerDashboardService service)
    {
        _service = service;
    }
    [HttpGet]
    public async Task<IActionResult> GetDashBoard()
    {
        var result = await _service.GetDashBoardAsync();
        return Ok(result);
    }
}