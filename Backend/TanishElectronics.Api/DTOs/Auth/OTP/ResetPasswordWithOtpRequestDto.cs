using System.ComponentModel.DataAnnotations;
using TanishElectronics.Api.Helpers;

namespace TanishElectronics.Api.DTOs.Auth;

public class ResetPasswordWithOtpRequestDto
{
    [Required, EmailAddress, MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required, RegularExpression("^[0-9]{6}$")]
    public string Code { get; set; } = string.Empty;

    [Required, MinLength(8), MaxLength(72), Utf8MaxLength(72)]
    public string NewPassword { get; set; } = string.Empty;
}