namespace TanishElectronics.Api.Interfaces.Services;

public interface IPasswordResetTokenService
{
    string GenerateToken();
    string HashToken(string token);
}