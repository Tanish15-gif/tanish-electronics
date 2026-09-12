using TanishElectronics.Api.Enums.Auth;

namespace TanishElectronics.Api.Interfaces.Services;

public interface IAuthEventLogger
{
    Task LogAsync(int? userId, string? email, AuthEventType type, bool success, string? description);
}