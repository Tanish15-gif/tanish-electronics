using Microsoft.AspNetCore.OutputCaching;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class PublicOutputCacheInvalidator : IPublicOutputCacheInvalidator
{
    private readonly IOutputCacheStore _outputCacheStore;
    private readonly ILogger<PublicOutputCacheInvalidator> _logger;
    public PublicOutputCacheInvalidator(IOutputCacheStore outputCacheStore, ILogger<PublicOutputCacheInvalidator> logger)
    {
        _outputCacheStore = outputCacheStore;
        _logger = logger;
    }

    public async Task EvictAnnouncementsAsync()
    {
        await EvictByTagAsync(OutputCachePolicies.AnnouncementsTag);
    }

    public async Task EvictFeedbacksAsync()
    {
        await EvictByTagAsync(OutputCachePolicies.FeedbacksTag);
    }

    public async Task EvictProductsAsync()
    {
        await EvictByTagAsync(OutputCachePolicies.ProductsTag);
    }

    public async Task EvictShopSettingsAsync()
    {
        await EvictByTagAsync(OutputCachePolicies.ShopSettingsTag);
    }

    public async Task EvictAllPublicAsync()
    {
        await EvictProductsAsync();
        await EvictAnnouncementsAsync();
        await EvictFeedbacksAsync();
        await EvictShopSettingsAsync();
    }

    private async Task EvictByTagAsync(string tag)
    {
        await _outputCacheStore.EvictByTagAsync(
            tag,
            CancellationToken.None
        );

        _logger.LogInformation(
            "Output cache evicted. Tag: {Tag}",
            tag
        );
    }
}