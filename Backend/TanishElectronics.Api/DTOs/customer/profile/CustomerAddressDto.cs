namespace TanishElectronics.Api.DTOs.Customer.Profile;

public class CustomerAddressDto
{
    public int CustomerAddressId { get; set; }

    public string? Label { get; set; }

    public string AddressLine { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public string State { get; set; } = string.Empty;

    public string Pincode { get; set; } = string.Empty;

    public bool IsDefault { get; set; }
}