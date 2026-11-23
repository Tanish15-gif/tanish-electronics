using Google.Apis.Auth;
using TanishElectronics.Api.Interfaces.Services.AuthService;

namespace TanishElectronics.Api.Services.AuthService;

public sealed class GoogleIdTokenValidator : IGoogleIdTokenValidator
{
    public Task<GoogleJsonWebSignature.Payload> ValidateAsync(string idToken, string clientId)
        => GoogleJsonWebSignature.ValidateAsync(idToken,
            new GoogleJsonWebSignature.ValidationSettings { Audience = [clientId] });
}
