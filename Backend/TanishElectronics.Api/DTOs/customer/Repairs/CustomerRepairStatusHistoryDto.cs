namespace TanishElectronics.Api.DTOs.Customer.Repairs;

public class CustomerRepairStatusHistoryDto
{
    public int StatusHistoryId { get; set; }
    public string? OldStatus { get; set; }
    public string NewStatus { get; set; } = string.Empty;
    public string? ChangedByName { get; set; }
    public string? Note { get; set; }
    public DateTime ChangedAt { get; set; }
}