using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;

namespace TanishElectronics.Api.Repositories;

public class ShopSettingsRepository : IShopSettingsRepository
{
    private readonly TanishElectronicsDbContext _dbContext;
    public ShopSettingsRepository(TanishElectronicsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ShopBusinessSetting?> GetSettingsAsync()
    {
        return await _dbContext.ShopBusinessSettings
            .OrderBy(settings => settings.ShopBusinessSettingId)
            .FirstOrDefaultAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}