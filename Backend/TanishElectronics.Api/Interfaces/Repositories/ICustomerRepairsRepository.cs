using TanishElectronics.Api.DTOs.Customer.Feedback;
using TanishElectronics.Api.DTOs.Customer.Repairs;
using TanishElectronics.Api.Interfaces.Repositories;

public interface ICustomerRepairsRepository
{
    Task<CustomerRepairDetailsDto?> GetRepairDetailsAsync(int serviceRequestId, int customerId);
    Task<string?> GetRepairStatusNameAsync(
        int serviceRequestId,
        int customerId
    );

    Task<CustomerRepairFeedbackDto?> GetFeedbackAsync(
        int serviceRequestId,
        int customerId
    );

    Task<CustomerRepairFeedbackDto> UpsertFeedbackAsync(
        int serviceRequestId,
        int customerId,
        int rating,
        string? comment
    );
    Task<List<CustomerRepairFeedbackCenterItemDto>> GetFeedbackCenterAsync(int customerId);
}