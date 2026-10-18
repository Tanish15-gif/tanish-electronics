using System.Text;
using TanishElectronics.Api.Exceptions;

namespace TanishElectronics.Api.Helpers;

public static class AuthValidation
{
    public static void ValidateNewPassword(string? password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
            throw new BadRequestException("Password must be at least 8 characters.");
        if (Encoding.UTF8.GetByteCount(password) > 72)
            throw new BadRequestException("Password must not exceed 72 UTF-8 bytes.");
    }
}
