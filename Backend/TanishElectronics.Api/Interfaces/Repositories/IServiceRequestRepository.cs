using TanishElectronics.Api.DTOs.Admin.ServiceRequests;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.DTOs.ServiceRequests;
using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Repositories;

public interface IServiceRequestRepository
{
    Task<bool> IsServiceCategoryActiveAsync(int serviceCategoryId);
    Task<bool> IsServiceLocationAvailableAsync(int serviceLocationId);
    Task<int> GetStatusIdByNameAsync(string statusName);
    Task<Customer?> GetCustomerByPhoneAsync(string phoneNumber);
    Task AddCustomerAsync(Customer customer);
    Task<string> GenerateRequestNumberAsync();
    Task AddServiceRequestAsync(ServiceRequest serviceRequest);
    Task AddStatusHistoryAsync(ServiceRequestStatusHistory history);

    Task<ServiceRequestTrackingDto?> GetTrackingDetailsAsync(string requestNumber, string phoneNumber);

    Task<PagedResultDto<AdminServiceRequestListItemDto>> GetAdminServiceRequestsAsync(AdminServiceRequestQueryDto query);

    Task<AdminServiceRequestDetailsDto?> GetAdminServiceRequestByIdAsync(int serviceRequestId);

    Task<ServiceRequest?> GetServiceRequestEntityByIdAsync(int serviceRequestId);
    Task<bool> ServiceStatusExistAsync(int statusId);

    Task<bool> UpdatePricingAsync(int id, decimal? estimatedPrice, decimal? finalPrice, string? adminNotes, string? paymentStatus);


    Task<bool> ServiceRequestExistsAsync(int serviceRequestId);

    Task AddServiceRequestImagesAsync(List<ServiceRequestImage> images);

    Task<ServiceRequest?> GetServiceRequestDetailsWithImagesAsync(int serviceRequestId);


    Task<bool> UpdateRepairWorkNotesAsync(int id, string? diagnosis, string? workNotes, string? partsUsed, string? warrantyNote, bool showRepairNotesToCustomer);

    Task SaveChangesAsync();
}