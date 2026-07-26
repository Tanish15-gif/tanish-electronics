using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Route("api/email-test")]
public sealed class EmailTestController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly IWebHostEnvironment _environment;

    public EmailTestController(
        IEmailService emailService,
        IWebHostEnvironment environment
    )
    {
        _emailService = emailService;
        _environment = environment;
    }

    [HttpPost]
    public async Task<IActionResult> SendTestEmail(
        [FromQuery] string email,
        CancellationToken cancellationToken
    )
    {
        if (!_environment.IsDevelopment())
        {
            return NotFound();
        }

        await _emailService.SendAsync(
            email,
            "Tanish Electronics email test",
            """
            <div style="font-family:Arial,sans-serif">
                <h2>Email service is working ✅</h2>
                <p>Your Tanish Electronics API successfully sent this email.</p>
            </div>
            """,
            "Email service is working. Your Tanish Electronics API successfully sent this email.",
            cancellationToken
        );

        return Ok(new
        {
            message = "Test email sent successfully."
        });
    }
}