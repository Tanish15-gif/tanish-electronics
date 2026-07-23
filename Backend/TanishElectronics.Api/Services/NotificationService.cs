using TanishElectronics.Api.DTOs.Admin.Notifications;
using TanishElectronics.Api.DTOs.Customer.Notifications;
using TanishElectronics.Api.Exceptions;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repository;
    private readonly ICustomerAccountResolver _customerAccountResolver;
    public NotificationService(INotificationRepository repository, ICustomerAccountResolver customerAccountResolver)
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
        var allreaded = await _repository.AdminMarkAllAsReadAsync();
        return allreaded;
    }

    public async Task<bool> AdminMarkAsReadAsync(int notificationId)
    {
        var readed = await _repository.AdminMarkAsReadAsync(notificationId);
        return readed;
    }

    public async Task<bool> CustomerMarkAllAsReadAsync()
    {
        var customer = await _customerAccountResolver.GetCurrentCustomerAsync();
        if (customer == null) throw new CustomerProfileIncompleteException("Complete your customer profile first");

        return await _repository.CustomerMarkAllAsReadAsync(customer.CustomerId);
    }

    public async Task<bool> CustomerMarkAsReadAsync(int notificationId)
    {
        var customer = await _customerAccountResolver.GetCurrentCustomerAsync();

        if (customer == null) throw new CustomerProfileIncompleteException("Complete your customer profile first");

        return await _repository.CustomerMarkAsReadAsync(customer.CustomerId, notificationId);
    }

    public async Task<List<GetCustomerNotificatonDto>> GetCurrentCustomerNotificationsAsync()
    {
        var customer = await _customerAccountResolver.GetCurrentCustomerAsync();

        if (customer == null) throw new CustomerProfileIncompleteException("Complete your customer profile first");

        return await _repository.GetByCustomerIdAsync(customer.CustomerId);
    }
}