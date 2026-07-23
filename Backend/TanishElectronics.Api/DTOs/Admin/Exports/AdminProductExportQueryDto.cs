namespace TanishElectronics.Api.DTOs.Admin.Exports;

public class AdminProductExportQueryDto
{
    public string? Search { get; set; }

    public int? CategoryId { get; set; }

    public bool? IsAvailable { get; set; }
}