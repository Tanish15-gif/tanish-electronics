namespace TanishElectronics.Api.Interfaces.Services;

public interface ICurrentUserService
{
    Task<int?> GetCurrentAppUserIdAsync();
    Task<int> GetRequiredCurrentAppUserIdAsync();
}