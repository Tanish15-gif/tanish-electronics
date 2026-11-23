using System.ComponentModel.DataAnnotations;
using TanishElectronics.Api.Helpers;

namespace TanishElectronics.Api.DTOs.Auth;

public class RefreshTokenRequestDto
{
    [Required, MaxLength(512)]
    public string RefreshToken { get; set; } = string.Empty;
}