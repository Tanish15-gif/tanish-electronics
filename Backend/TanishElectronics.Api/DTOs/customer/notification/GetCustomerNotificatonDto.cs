namespace TanishElectronics.Api.DTOs.Customer.Notifications;

public class GetCustomerNotificatonDto
{
    public int CustomerId { get; set; }
    public int? CustomerNotificationId { get; set; }
    public int? ServiceRequestId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}