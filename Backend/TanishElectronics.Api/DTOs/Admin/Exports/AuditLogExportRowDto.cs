namespace TanishElectronics.Api.DTOs.Admin.Exports;

public class AuditLogExportRowDto
{
    public int AuditLogId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public int? EntityId { get; set; }
    public string? Description { get; set; }

    public string? AdminName { get; set; }
    public string? AdminEmail { get; set; }

    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; }
}