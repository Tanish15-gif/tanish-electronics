using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace TanishElectronics.Api.Constants;

public class AuthSchemes
{
    public const string CustomJwt = "tanish-electronics";
    public const string ClerkJwt = JwtBearerDefaults.AuthenticationScheme;
}