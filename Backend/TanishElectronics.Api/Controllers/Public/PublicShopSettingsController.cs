using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Public;
using TanishElectronics.Api.Interfaces.Services;
using TanishElectronics.Api.Settings;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[AllowAnonymous]
[EnableRateLimiting(RateLimitPolicies.PublicRead)]
[Route("public/shop-settings")]
public class PublicShopSettingsController : ControllerBase
{
    private readonly IShopSettingsService _shopSettingsService;
    public PublicShopSettingsController(IShopSettingsService shopSettingsService)
    {
        _shopSettingsService = shopSettingsService;
    }

    [HttpGet]
    [OutputCache(
        PolicyName = OutputCachePolicies.PublicStatic,
        Tags = new[] { OutputCachePolicies.ShopSettingsTag }
    )]
    public async Task<IActionResult> GetShopSettings()
    {
        var settings = await _shopSettingsService.GetPublicSettingsAsync();

        return Ok(settings);
    }
}