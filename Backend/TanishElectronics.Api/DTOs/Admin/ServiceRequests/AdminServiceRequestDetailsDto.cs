namespace TanishElectronics.Api.DTOs.Admin.ServiceRequests;

public class AdminServiceRequestDetailsDto
{
    public int ServiceRequestId { get; set; }
    public string RequestNumber { get; set; } = "";

    public string CustomerName { get; set; } = "";
    public string PhoneNumber { get; set; } = "";
    public string? Email { get; set; }

    public string ServiceCategory { get; set; } = "";
    public string CurrentStatus { get; set; } = "";
    public int CurrentStatusId { get; set; }

    public string? DeviceName { get; set; }
    public string? Brand { get; set; }
    public string? ModelName { get; set; }

    public string IssueDescription { get; set; } = "";

    public string ServiceType { get; set; } = "";
    public string? VisitAddress { get; set; }

    public DateOnly? PreferredDate { get; set; }
    public string? PreferredTimeSlot { get; set; }

    public decimal? EstimatedPrice { get; set; }
    public decimal? FinalPrice { get; set; }

    public string? AdminNotes { get; set; }

    public string PaymentStatus { get; set; } = "Pending";

    public DateTime? PaidAt { get; set; }

    public string? Diagnosis { get; set; }
    public string? WorkNotes { get; set; }
    public string? PartsUsed { get; set; }
    public string? WarrantyNote { get; set; }
    public bool ShowRepairNotesToCustomer { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<AdminServiceRequestImageDto> Images { get; set; } = new();
    public List<AdminServiceRequestStatusHistoryDto> StatusHistory { get; set; } = new();
}