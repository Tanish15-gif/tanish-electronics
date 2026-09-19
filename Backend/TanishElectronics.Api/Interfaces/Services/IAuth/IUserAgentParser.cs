using TanishElectronics.Api.Models.Auth;

namespace TanishElectronics.Api.Interfaces.Services;

public interface IUserAgentParser
{
    UserAgentDetails Parse(string? userAgent);
}