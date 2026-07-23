namespace TanishElectronics.Api.DTOs.Admin.ServiceRequests;

public class UpdateRepairWorkNotesDto
{
    public string? Diagnosis { get; set; }
    public string? WorkNotes { get; set; }
    public string? PartsUsed { get; set; }
    public string? WarrantyNote { get; set; }
    public bool ShowRepairNotesToCustomer { get; set; }
}