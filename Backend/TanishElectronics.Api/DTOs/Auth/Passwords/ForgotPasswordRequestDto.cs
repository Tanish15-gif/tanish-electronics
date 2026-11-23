using System.ComponentModel.DataAnnotations;
using TanishElectronics.Api.Helpers;

namespace TanishElectronics.Api.DTOs.Auth;

public class ForgotPasswordRequestDto
{
    [Required, EmailAddress, MaxLength(150)]
    public string Email { get; set; } = string.Empty;
}