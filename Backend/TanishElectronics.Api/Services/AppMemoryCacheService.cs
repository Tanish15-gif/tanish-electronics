using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Memory;

public class AppMemoryCacheService : IAppMemoryCacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly ConcurrentDictionary<string, bool> _cacheKeys = new();
    public AppMemoryCacheService(IMemoryCache memoryCache)
    {
        _memoryCache = memoryCache;
    }
    public async Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan expiration)
    {
        if (_memoryCache.TryGetValue(key, out T? cachedValue) && cachedValue != null) return cachedValue;

        var value = await factory();

        _memoryCache.Set(key, value, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiration
        });
        _cacheKeys.TryAdd(key, true);

        return value;
    }

    public void Remove(string key)
    {
        _memoryCache.Remove(key);
        _cacheKeys.TryRemove(key, out _);
    }

    public void RemoveByPrefix(string prefix)
    {
        var keysToRemove = _cacheKeys.Keys
            .Where(key => key.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            .ToList();

        foreach (var key in keysToRemove)
        {
            Remove(key);
        }
    }
}