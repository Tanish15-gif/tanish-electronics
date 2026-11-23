using System.ComponentModel.DataAnnotations;
using TanishElectronics.Api.Helpers;

namespace TanishElectronics.Api.DTOs.Auth;

public class CompleteSetPasswordRequestDto
{
    [Required, MaxLength(512)]
    public string SetupToken { get; set; } = string.Empty;

    [Required, MinLength(8), MaxLength(72), Utf8MaxLength(72)]
    public string NewPassword { get; set; } = string.Empty;
}