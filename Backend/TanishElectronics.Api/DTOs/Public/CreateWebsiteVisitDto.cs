namespace TanishElectronics.Api.DTOs.Public;

public class CreateWebsiteVisitDto
{
    public Guid? VisitorId { get; set; }
    public string Path { get; set; } = string.Empty;
    public string? Referrer { get; set; }
}