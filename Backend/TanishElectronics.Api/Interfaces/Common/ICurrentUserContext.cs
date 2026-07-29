namespace TanishElectronics.Api.Interfaces.Common;

public interface ICurrentUserContext
{
    int UserId { get; }
    string? IpAddress { get; }
}