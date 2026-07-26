using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using TanishElectronics.Api.Interfaces.Services;
using TanishElectronics.Api.Settings;

namespace TanishElectronics.Api.Services;

public class MailKitEmailService : IEmailService
{
    private readonly EmailSettings _emailSettings;
    public MailKitEmailService(IOptions<EmailSettings> options)
    {
        _emailSettings = options.Value;
    }
    public async Task SendAsync(string toEmail, string subject, string htmlBody, string textBody, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(toEmail))
        {
            throw new ArgumentException("Recipient email is required.", nameof(toEmail));
        }
        var message = new MimeMessage();

        message.From.Add(new MailboxAddress(
            _emailSettings.FromName, _emailSettings.FromEmail
        ));

        message.To.Add(MailboxAddress.Parse(toEmail.Trim()));

        message.Subject = subject;

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = htmlBody,
            TextBody = textBody
        };

        message.Body = bodyBuilder.ToMessageBody();

        using var smtpClient = new SmtpClient();

        try
        {
            await smtpClient.ConnectAsync(
                _emailSettings.Host,
                _emailSettings.Port,
                SecureSocketOptions.StartTls,
                cancellationToken
            );

            await smtpClient.AuthenticateAsync(
                _emailSettings.Username,
                _emailSettings.Password,
                cancellationToken
            );

            await smtpClient.SendAsync(
                message,
                cancellationToken
            );
        }
        finally
        {
            if (smtpClient.IsConnected)
            {
                await smtpClient.DisconnectAsync(
                    true,
                    cancellationToken
                );
            }
        }
    }
}