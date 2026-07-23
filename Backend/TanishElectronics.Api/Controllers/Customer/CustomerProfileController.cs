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
        var clerkUserId = GetClerkUserId();

        var result = await _service.GetProfileAsync(clerkUserId);
        return Ok(result);
    }
    [HttpPut("details")]
    public async Task<IActionResult> UpdateDetails(UpdateCustomerProfileDto dto)
    {
        var clerkUserId = GetClerkUserId();

        var result = await _service.UpdateProfileAsync(clerkUserId, dto);
        return Ok(result);
    }
    [HttpGet("addresses")]
    public async Task<IActionResult> GetAddresses()
    {
        var clerkUserId = GetClerkUserId();

        var result = await _service.GetAddressesAsync(clerkUserId);
        return Ok(result);
    }
    [HttpPost("addresses")]
    public async Task<IActionResult> AddAddress(UpsertCustomerAddressDto dto)
    {
        var clerkUserId = GetClerkUserId();
        var result = await _service.AddAddressAsync(clerkUserId, dto);
        return Ok(result);
    }
    [HttpPut("addresses/{addressId:int}")]
    public async Task<IActionResult> UpdateAddress(
    int addressId,
    UpsertCustomerAddressDto dto
    )
    {
        var clerkUserId = GetClerkUserId();

        var result = await _service.UpdateAddressAsync(
            clerkUserId,
            addressId,
            dto
        );

        return Ok(result);
    }
    [HttpPut("addresses/{addressId:int}/default")]
    public async Task<IActionResult> SetDefaultAddress(int addressId)
    {
        var clerkUserId = GetClerkUserId();

        var result = await _service.SetDefaultAddressAsync(
            clerkUserId,
            addressId
        );

        return Ok(result);
    }
    [HttpDelete("addresses/{addressId:int}")]
    public async Task<IActionResult> DeleteAddress(int addressId)
    {
        var clerkUserId = GetClerkUserId();
        await _service.DeleteAddressAsync(clerkUserId, addressId);

        return Ok(new
        {
            message = "Address deleted successfully."
        });
    }
    private string GetClerkUserId()
    {
        var clerkUserId =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(clerkUserId))
        {
            throw new UnauthorizedAccessException("Invalid authentication token.");
        }

        return clerkUserId;
    }
}