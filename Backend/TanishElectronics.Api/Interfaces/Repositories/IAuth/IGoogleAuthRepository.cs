using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Repositories.Auth;

public interface IGoogleAuthRepository
{
    Task<ExternalLogin?> GetExternalLoginAsync(string provider, string providerUserId);

    Task AddExternalLoginAsync(ExternalLogin externalLogin);
    Task CreatePasswordSetupSessionAsync(PasswordResetSession setupSession);
    Task CompletePasswordSetupAsync(AppUser user, PasswordResetSession setupSession);
}