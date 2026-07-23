namespace TanishElectronics.Api.DTOs.Common;

public class CsvExportResultDto
{
    public string FileName { get; set; } = string.Empty;

    public string ContentType { get; set; } = "text/csv; charset=utf-8";
    public byte[] Content { get; set; } = Array.Empty<byte>();
}