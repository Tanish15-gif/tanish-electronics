namespace TanishElectronics.Api.Interfaces.Services;

public interface IPublicOutputCacheInvalidator
{
    Task EvictProductsAsync();
    Task EvictAnnouncementsAsync();
    Task EvictFeedbacksAsync();
    Task EvictShopSettingsAsync();
    Task EvictAllPublicAsync();
}