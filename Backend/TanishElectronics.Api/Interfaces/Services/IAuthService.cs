using TanishElectronics.Api.DTOs.Auth;

namespace TanishElectronics.Api.Interfaces.Services;

public interface IAuthService
{
    Task<AuthUserDto> SyncUserAsync(string clerkUserId, SyncUserDto dto);
    Task<AuthUserDto> GetCurrentUserAsync(string clerkUserId);
}