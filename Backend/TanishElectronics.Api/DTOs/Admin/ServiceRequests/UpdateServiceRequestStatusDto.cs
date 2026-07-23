namespace TanishElectronics.Api.DTOs.Admin.ServiceRequests;

public class UpdateServiceRequestStatusDto
{
    public int NewStatusId { get; set; }
    public string? Note { get; set; }
    public bool IsCorrection { get; set; }
}