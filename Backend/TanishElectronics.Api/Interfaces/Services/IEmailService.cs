namespace TanishElectronics.Api.Interfaces.Services;

public interface IEmailService
{
    Task SendAsync(string toEmail, string subject, string htmlBody, string textBody, CancellationToken cancellationToken = default);
}