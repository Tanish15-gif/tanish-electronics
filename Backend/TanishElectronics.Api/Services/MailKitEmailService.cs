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
    private readonly ILogger<MailKitEmailService> _logger;

    public MailKitEmailService(
        IOptions<EmailSettings> options,
        ILogger<MailKitEmailService> logger)
    {
        _emailSettings = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(
        string toEmail,
        string subject,
        string htmlBody,
        string textBody,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(toEmail))
        {
            throw new ArgumentException("Recipient email is required.", nameof(toEmail));
        }

        if (string.IsNullOrWhiteSpace(_emailSettings.Username) || string.IsNullOrWhiteSpace(_emailSettings.Password))
        {
            _logger.LogError("SMTP credentials are not configured in EmailSettings.");
            throw new InvalidOperationException("Email service is not properly configured. Please contact support.");
        }

        var message = new MimeMessage();

        message.From.Add(new MailboxAddress(
            _emailSettings.FromName,
            !string.IsNullOrWhiteSpace(_emailSettings.FromEmail) ? _emailSettings.FromEmail : _emailSettings.Username
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

            await smtpClient.SendAsync(message, cancellationToken);
            _logger.LogInformation("Email sent successfully to {Recipient} with subject '{Subject}'", toEmail, subject);
        }
        catch (AuthenticationException ex)
        {
            _logger.LogError(
                ex,
                "SMTP authentication failed for user '{Username}'. Ensure your 16-character Google App Password is valid.",
                _emailSettings.Username
            );
            throw new InvalidOperationException("Email delivery authentication failed. Please verify your Google App Password.", ex);
        }
        catch (SmtpCommandException ex)
        {
            _logger.LogError(
                ex,
                "SMTP server rejected command while sending email to '{Recipient}'. Status: {StatusCode}",
                toEmail,
                ex.StatusCode
            );
            throw new InvalidOperationException($"Email server error: {ex.Message}", ex);
        }
        catch (Exception ex) when (ex is not InvalidOperationException)
        {
            _logger.LogError(ex, "Unexpected error occurred while delivering email to '{Recipient}'", toEmail);
            throw new InvalidOperationException("Unable to deliver verification email. Please try again later.", ex);
        }
        finally
        {
            if (smtpClient.IsConnected)
            {
                await smtpClient.DisconnectAsync(true, cancellationToken);
            }
        }
    }
}