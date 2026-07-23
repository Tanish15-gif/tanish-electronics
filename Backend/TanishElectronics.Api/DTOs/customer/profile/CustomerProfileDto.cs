namespace TanishElectronics.Api.DTOs.Customer.Profile;

public class CustomerProfileDto
{
    public int AppUserId { get; set; }
    public int? CustomerId { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? PhoneNumber { get; set; }

    public bool IsProfileCompleted { get; set; }
    public List<CustomerAddressDto> Addresses { get; set; } = new();
}