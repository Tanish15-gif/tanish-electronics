namespace TanishElectronics.Api.DTOs.Admin.AuditLogs;

public class AdminAuditLogDto
{
    public int AuditLogId { get; set; }
    public int? AppUserId { get; set; }

    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public int? EntityId { get; set; }

    public string? Description { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; }
}