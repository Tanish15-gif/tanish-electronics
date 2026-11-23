using Google.Apis.Auth;

namespace TanishElectronics.Api.Interfaces.Services.AuthService;

public interface IGoogleIdTokenValidator
{
    Task<GoogleJsonWebSignature.Payload> ValidateAsync(string idToken, string clientId);
}
