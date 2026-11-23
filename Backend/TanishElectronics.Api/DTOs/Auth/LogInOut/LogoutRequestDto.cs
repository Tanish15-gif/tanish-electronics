using System.ComponentModel.DataAnnotations;
using TanishElectronics.Api.Helpers;

namespace TanishElectronics.Api.DTOs.Auth;

public class LogoutRequestDto
{
    [Required, MaxLength(512)]
    public string RefreshToken { get; set; } = string.Empty;
}