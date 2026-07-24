using TanishElectronics.Api.DTOs.Admin.Notifications;
using TanishElectronics.Api.DTOs.Customer.Notifications;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repository;
    private readonly ICustomerAccountResolver _customerAccountResolver;

    public NotificationService(
        INotificationRepository repository,
        ICustomerAccountResolver customerAccountResolver
    )
    {
        _repository = repository;
        _customerAccountResolver = customerAccountResolver;
    }

    public async Task<List<GetAdminNotificationDto>> GetAdminNotificationAsync()
    {
        return await _repository.GetAdminNotification();
    }

    public async Task<bool> AdminMarkAllAsReadAsync()
    {
        return await _repository.AdminMarkAllAsReadAsync();
    }

    public async Task<bool> AdminMarkAsReadAsync(int notificationId)
    {
        return await _repository.AdminMarkAsReadAsync(notificationId);
    }

    public async Task<bool> CustomerMarkAllAsReadAsync()
    {
        var customerId = await _customerAccountResolver.GetRequiredCustomerIdAsync();

        return await _repository.CustomerMarkAllAsReadAsync(customerId);
    }

    public async Task<bool> CustomerMarkAsReadAsync(int notificationId)
    {
        var customerId = await _customerAccountResolver.GetRequiredCustomerIdAsync();

        return await _repository.CustomerMarkAsReadAsync(
            customerId,
            notificationId
        );
    }

    public async Task<List<GetCustomerNotificatonDto>> GetCurrentCustomerNotificationsAsync()
    {
        var customerId = await _customerAccountResolver.GetRequiredCustomerIdAsync();

        return await _repository.GetByCustomerIdAsync(customerId);
    }
}