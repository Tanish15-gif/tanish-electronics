using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Enums.Auth;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;
using TanishElectronics.Api.Interfaces.Services.AuthService;

namespace TanishElectronics.Api.Services.AuthService.Context;

public class AuthEventLogger : IAuthEventLogger
{
    private readonly ICustomAuthRepository _authRepository;
    private readonly IAuthContextAccessor _authContextAccessor;
    public AuthEventLogger
    (
        IAuthContextAccessor authContextAccessor,
        ICustomAuthRepository authRepository
    )
    {
        _authContextAccessor = authContextAccessor;
        _authRepository = authRepository;
    }
    public async Task LogAsync(
        int? appUserId,
        string? email,
        AuthEventType eventType,
        bool success,
        string? description
    )
    {
        var authEvent = new UserAuthEvent
        {
            AppUserId = appUserId,
            Email = email,
            EventType = eventType.ToString(),
            Success = success,
            IpAddress = _authContextAccessor.GetClientIpAddress(),
            UserAgent = _authContextAccessor.GetUserAgent(),
            Description = description,
            CreatedAt = DateTime.UtcNow
        };

        await _authRepository.AddAuthEventAsync(authEvent);
    }
}