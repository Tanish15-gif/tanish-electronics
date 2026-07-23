namespace TanishElectronics.Api.DTOs.Admin.AuditLogs;

public class AdminAuditLogQueryDto
{
    public string? Search { get; set; }
    public string? Action { get; set; }
    public string? EntityName { get; set; }

    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}