using TanishElectronics.Api.DTOs.Customer.Feedback;
using TanishElectronics.Api.DTOs.Customer.Repairs;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class CustomerRepairsService : ICustomerRepairsService
{
    private readonly ICustomerRepairsRepository _repository;
    private readonly ICustomerAccountResolver _customerAccountResolver;

    public CustomerRepairsService(
        ICustomerRepairsRepository repository,
        ICustomerAccountResolver customerAccountResolver
    )
    {
        _repository = repository;
        _customerAccountResolver = customerAccountResolver;
    }

    public async Task<CustomerRepairFeedbackDto?> GetFeedbackAsync(int serviceRequestId)
    {
        var customer = await _customerAccountResolver.GetCurrentCustomerAsync();

        if (customer == null)
        {
            throw new InvalidOperationException(
                "Complete your customer profile first."
            );
        }

        var statusName = await _repository.GetRepairStatusNameAsync(
            serviceRequestId,
            customer.CustomerId
        );

        if (statusName == null)
        {
            throw new KeyNotFoundException("Repair request not found.");
        }

        return await _repository.GetFeedbackAsync(
            serviceRequestId,
            customer.CustomerId
        );
    }

    public async Task<CustomerRepairDetailsDto> GetRepairDetailsAsync(
        int serviceRequestId
    )
    {
        var customer = await _customerAccountResolver.GetCurrentCustomerAsync();

        if (customer == null)
        {
            throw new InvalidOperationException(
                "Please complete your customer profile first."
            );
        }

        var repair = await _repository.GetRepairDetailsAsync(
            serviceRequestId,
            customer.CustomerId
        );

        if (repair == null)
        {
            throw new KeyNotFoundException("Repair request not found.");
        }

        return repair;
    }

    public async Task<CustomerRepairFeedbackDto> UpsertFeedbackAsync(int serviceRequestId, UpsertCustomerRepairFeedbackDto dto)
    {
        var customer = await _customerAccountResolver.GetCurrentCustomerAsync();

        if (customer == null)
        {
            throw new InvalidOperationException(
                "Please complete your customer profile first."
            );
        }

        var statusName = await _repository.GetRepairStatusNameAsync(
            serviceRequestId,
            customer.CustomerId
        );

        if (statusName == null)
        {
            throw new KeyNotFoundException("Repair request not found.");
        }

        if (!statusName.ToLower().Contains("completed"))
        {
            throw new InvalidOperationException(
                "Feedback can be added only after repair is completed."
            );
        }

        if (dto.Rating < 1 || dto.Rating > 5)
        {
            throw new InvalidOperationException("Rating must be between 1 and 5.");
        }

        var cleanComment = string.IsNullOrWhiteSpace(dto.Comment)
            ? null
            : dto.Comment.Trim();

        if (cleanComment != null && cleanComment.Length > 1000)
        {
            throw new InvalidOperationException(
                "Feedback comment cannot be more than 1000 characters."
            );
        }

        return await _repository.UpsertFeedbackAsync(
            serviceRequestId,
            customer.CustomerId,
            dto.Rating,
            cleanComment
        );
    }
    public async Task<List<CustomerRepairFeedbackCenterItemDto>> GetFeedbackCenterAsync()
    {
        var customer = await _customerAccountResolver.GetCurrentCustomerAsync();

        if (customer == null)
        {
            throw new InvalidOperationException(
                "Please complete your customer profile first."
            );
        }

        return await _repository.GetFeedbackCenterAsync(customer.CustomerId);
    }
}