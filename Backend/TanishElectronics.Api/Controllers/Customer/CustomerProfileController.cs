using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Customer.Profile;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Authorize(Policy = AppPolicies.CustomerOnly)]
[Route("[controller]")]
public class CustomerProfileController : ControllerBase
{
    private readonly ICustomerProfileService _service;
    public CustomerProfileController(ICustomerProfileService service)
    {
        _service = service;
    }
    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var result = await _service.GetProfileAsync();
        return Ok(result);
    }
    [HttpPut("details")]
    public async Task<IActionResult> UpdateDetails(UpdateCustomerProfileDto dto)
    {
        var result = await _service.UpdateProfileAsync(dto);
        return Ok(result);
    }
    [HttpGet("addresses")]
    public async Task<IActionResult> GetAddresses()
    {
        var result = await _service.GetAddressesAsync();
        return Ok(result);
    }
    [HttpPost("addresses")]
    public async Task<IActionResult> AddAddress(UpsertCustomerAddressDto dto)
    {
        var result = await _service.AddAddressAsync(dto);
        return Ok(result);
    }
    [HttpPut("addresses/{addressId:int}")]
    public async Task<IActionResult> UpdateAddress(int addressId, UpsertCustomerAddressDto dto)
    {
        var result = await _service.UpdateAddressAsync(addressId, dto);

        return Ok(result);
    }
    [HttpPut("addresses/{addressId:int}/default")]
    public async Task<IActionResult> SetDefaultAddress(int addressId)
    {
        var result = await _service.SetDefaultAddressAsync(addressId);

        return Ok(result);
    }
    [HttpDelete("addresses/{addressId:int}")]
    public async Task<IActionResult> DeleteAddress(int addressId)
    {
        await _service.DeleteAddressAsync(addressId);

        return Ok(new
        {
            message = "Address deleted successfully."
        });
    }
}