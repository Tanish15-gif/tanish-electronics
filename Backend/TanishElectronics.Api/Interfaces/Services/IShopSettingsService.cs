using TanishElectronics.Api.DTOs.Admin.Settings;
using TanishElectronics.Api.DTOs.Public;

namespace TanishElectronics.Api.Interfaces.Services;

public interface IShopSettingsService
{
    Task<PublicShopSettingsDto> GetPublicSettingsAsync();
    Task<AdminShopSettingsDto> GetAdminSettingsAsync();

    Task<AdminShopSettingsDto> UpdateSettingsAsync(UpdateShopSettingsDto dto, int adminAppUserId);
}