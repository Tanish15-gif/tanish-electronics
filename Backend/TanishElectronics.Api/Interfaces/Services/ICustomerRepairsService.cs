using TanishElectronics.Api.DTOs.Customer.Feedback;
using TanishElectronics.Api.DTOs.Customer.Repairs;
using TanishElectronics.Api.Interfaces.Services;

public interface ICustomerRepairsService
{
    Task<CustomerRepairDetailsDto> GetRepairDetailsAsync(int serviceRequestId);

    Task<CustomerRepairFeedbackDto?> GetFeedbackAsync(int serviceRequestId);

    Task<CustomerRepairFeedbackDto> UpsertFeedbackAsync(
        int serviceRequestId,
        UpsertCustomerRepairFeedbackDto dto
    );
    Task<List<CustomerRepairFeedbackCenterItemDto>> GetFeedbackCenterAsync();
}