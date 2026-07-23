using TanishElectronics.Api.DTOs.ServiceRequests;

public class CreateServiceRequestDto
{
    public string CustomerName { get; set; } = "";
    public string PhoneNumber { get; set; } = "";
    public string? Email { get; set; }

    public int ServiceCategoryId { get; set; }
    public int? ServiceLocationId { get; set; }

    public string? DeviceName { get; set; }
    public string? Brand { get; set; }
    public string? ModelName { get; set; }

    public string IssueDescription { get; set; } = "";

    public string ServiceType { get; set; } = "Home Visit";

    public int? CustomerAddressId { get; set; }

    public string? VisitAddress { get; set; }

    public DateOnly? PreferredDate { get; set; }

    public string? PreferredTimeSlot { get; set; }
}