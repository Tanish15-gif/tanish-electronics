namespace TanishElectronics.Api.Interfaces.Services.AuthService;

public interface IAuthContextAccessor
{
    string? GetClientIpAddress();
    string? GetUserAgent();
    int GetAuthenticatedUserId();
    Guid GetAuthenticatedSessionId();
}