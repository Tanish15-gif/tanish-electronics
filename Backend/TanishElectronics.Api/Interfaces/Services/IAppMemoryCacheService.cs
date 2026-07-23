public interface IAppMemoryCacheService
{
    Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan expiration);

    void Remove(string key);

    void RemoveByPrefix(string prefix);
}