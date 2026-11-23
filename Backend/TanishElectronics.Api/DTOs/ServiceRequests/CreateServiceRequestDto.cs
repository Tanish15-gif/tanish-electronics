using System.ComponentModel.DataAnnotations;
using TanishElectronics.Api.Helpers;

using TanishElectronics.Api.DTOs.ServiceRequests;

public class CreateServiceRequestDto
{
    [Required, MaxLength(120)]
    public string CustomerName { get; set; } = "";
    [Required, MaxLength(20)]
    public string PhoneNumber { get; set; } = "";
    [OptionalEmail, MaxLength(150)]
    public string? Email { get; set; }

    public int ServiceCategoryId { get; set; }
    public int? ServiceLocationId { get; set; }

    [MaxLength(120)]
    public string? DeviceName { get; set; }
    [MaxLength(100)]
    public string? Brand { get; set; }
    [MaxLength(100)]
    public string? ModelName { get; set; }

    [Required, MaxLength(800)]
    public string IssueDescription { get; set; } = "";

    [Required, RegularExpression("^(Home Visit|Shop Repair)$")]
    public string ServiceType { get; set; } = "Home Visit";

    public int? CustomerAddressId { get; set; }

    [MaxLength(400)]
    public string? VisitAddress { get; set; }

    public DateOnly? PreferredDate { get; set; }

    [MaxLength(80)]
    public string? PreferredTimeSlot { get; set; }
}