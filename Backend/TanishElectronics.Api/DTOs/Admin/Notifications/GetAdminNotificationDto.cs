namespace TanishElectronics.Api.DTOs.Admin.Notifications;

public class GetAdminNotificationDto
{
    public int AdminNotificationId { get; set; }
    public int? ServiceRequestId { get; set; }
    public int? EnquiryId { get; set; }
    public int? ProductId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string NotificationType { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}