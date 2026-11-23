using System.ComponentModel.DataAnnotations;
using TanishElectronics.Api.Helpers;

namespace TanishElectronics.Api.DTOs.Auth;

public class GoogleLoginRequestDto
{
    [Required, MaxLength(8192)]
    public string IdToken { get; set; } = string.Empty;
}