using TanishElectronics.Api.DTOs.Customer.Feedback;

namespace TanishElectronics.Api.DTOs.Customer.Repairs;

public class CustomerRepairDetailsDto
{
    public int ServiceRequestId { get; set; }
    public string RequestNumber { get; set; } = string.Empty;

    public string CustomerName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }

    public string ServiceCategory { get; set; } = string.Empty;
    public string CurrentStatus { get; set; } = string.Empty;

    public string? DeviceName { get; set; }
    public string? Brand { get; set; }
    public string? ModelName { get; set; }

    public string IssueDescription { get; set; } = string.Empty;
    public string ServiceType { get; set; } = string.Empty;
    public string? VisitAddress { get; set; }

    public DateOnly? PreferredDate { get; set; }
    public string? PreferredTimeSlot { get; set; }

    public decimal? EstimatedPrice { get; set; }
    public decimal? FinalPrice { get; set; }

    public string PaymentStatus { get; set; } = "Pending";
    public DateTime? PaidAt { get; set; }

    public string? Diagnosis { get; set; }
    public string? WorkNotes { get; set; }
    public string? PartsUsed { get; set; }
    public string? WarrantyNote { get; set; }
    public bool ShowRepairNotesToCustomer { get; set; }

    public CustomerRepairFeedbackDto? Feedback { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    public List<CustomerRepairImageDto> Images { get; set; } = new();
    public List<CustomerRepairStatusHistoryDto> StatusHistory { get; set; } = new();
}