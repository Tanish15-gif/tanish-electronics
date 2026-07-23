namespace TanishElectronics.Api.Interfaces.Services;

public interface ICurrentUserService
{
    string? GetCurrentClerkUserId();

    Task<int?> GetCurrentAppUserIdAsync();
    Task<int> GetRequiredCurrentAppUserIdAsync();
}