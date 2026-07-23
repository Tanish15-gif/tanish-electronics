using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Admin.Settings;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Authorize(Policy = AppPolicies.AdminOnly)]
[EnableRateLimiting(RateLimitPolicies.AdminAction)]
[Route("admin/settings")]
public class AdminSettingsController : ControllerBase
{
    private readonly IShopSettingsService _shopSettingsService;
    private readonly ICurrentUserService _currentUserService;

    public AdminSettingsController(IShopSettingsService shopSettingsService, ICurrentUserService currentUserService)
    {
        _shopSettingsService = shopSettingsService;
        _currentUserService = currentUserService;
    }
    [HttpGet]
    public async Task<IActionResult> GetSettings()
    {
        var settings = await _shopSettingsService.GetAdminSettingsAsync();

        return Ok(settings);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateShopSettingsDto dto)
    {
        var adminAppUserId =
            await _currentUserService.GetRequiredCurrentAppUserIdAsync();

        var updatedSettings = await _shopSettingsService.UpdateSettingsAsync(
            dto,
            adminAppUserId
        );

        return Ok(new
        {
            message = "Shop settings updated successfully.",
            settings = updatedSettings
        });
    }
}