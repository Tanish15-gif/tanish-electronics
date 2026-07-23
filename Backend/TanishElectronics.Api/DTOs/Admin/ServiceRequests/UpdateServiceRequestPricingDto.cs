namespace TanishElectronics.Api.DTOs.Admin.ServiceRequests;

public class UpdateServiceRequestPricingDto
{
    public decimal? EstimatedPrice { get; set; }
    public decimal? FinalPrice { get; set; }
    public string? AdminNotes { get; set; }
    public string? PaymentStatus { get; set; }
}