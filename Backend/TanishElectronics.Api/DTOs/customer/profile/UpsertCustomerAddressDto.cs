namespace TanishElectronics.Api.DTOs.Customer.Profile;

public class UpsertCustomerAddressDto
{
    public string? Label { get; set; }

    public string AddressLine { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public string State { get; set; } = string.Empty;

    public string Pincode { get; set; } = string.Empty;

    public bool IsDefault { get; set; }
}