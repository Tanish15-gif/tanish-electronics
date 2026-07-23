namespace TanishElectronics.Api.DTOs.ServiceRequests;

public class UploadServiceRequestImagesResultDto
{
    public string Message { get; set; } = string.Empty;

    public List<string> ImageUrls { get; set; } = new();
}