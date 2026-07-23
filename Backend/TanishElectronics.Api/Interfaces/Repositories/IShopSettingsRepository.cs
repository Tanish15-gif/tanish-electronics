using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Repositories;

public interface IShopSettingsRepository
{
    Task<ShopBusinessSetting?> GetSettingsAsync();
    Task SaveChangesAsync();
}