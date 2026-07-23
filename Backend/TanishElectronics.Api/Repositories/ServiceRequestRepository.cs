using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Admin.ServiceRequests;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.DTOs.ServiceRequests;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;

namespace TanishElectronics.Api.Repositories;

public class ServiceRequestRepository : IServiceRequestRepository
{
    private readonly TanishElectronicsDbContext _dbContext;
    public ServiceRequestRepository(TanishElectronicsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<bool> IsServiceCategoryActiveAsync(int serviceCategoryId)
    {
        return await _dbContext.ServiceCategories
            .AnyAsync(category =>
                category.ServiceCategoryId == serviceCategoryId && category.IsActive);
    }

    public async Task<bool> IsServiceLocationAvailableAsync(int serviceLocationId)
    {
        return await _dbContext.ServiceLocations
            .AnyAsync(location =>
                location.ServiceLocationId == serviceLocationId && location.IsActive && location.IsHomeVisitAvailable
            );
    }

    public async Task<int> GetStatusIdByNameAsync(string statusName)
    {
        var status = await _dbContext.ServiceStatuses
            .FirstOrDefaultAsync(status => status.StatusName == statusName);

        if (status == null)
        {
            throw new InvalidOperationException($"Status `{statusName} was not found");
        }
        return status.ServiceStatusId;
    }

    public async Task<Customer?> GetCustomerByPhoneAsync(string phoneNumber)
    {
        return await _dbContext.Customers
            .FirstOrDefaultAsync(customer =>
            customer.PhoneNumber == phoneNumber && customer.IsActive);
    }

    public async Task AddCustomerAsync(Customer customer)
    {
        await _dbContext.Customers.AddAsync(customer);
    }

    public async Task<string> GenerateRequestNumberAsync()
    {
        var year = DateTime.Now.Year;
        var prefix = $"TE-{year}-";

        var countThisYear = await _dbContext.ServiceRequests
            .CountAsync(request => request.RequestNumber.StartsWith(prefix));

        var nextNumber = countThisYear + 1;

        return $"{prefix}{nextNumber:D5}";
    }

    public async Task AddServiceRequestAsync(ServiceRequest serviceRequest)
    {
        await _dbContext.ServiceRequests.AddAsync(serviceRequest);
    }

    public async Task AddStatusHistoryAsync(ServiceRequestStatusHistory history)
    {
        await _dbContext.ServiceRequestStatusHistories.AddAsync(history);
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }

    public async Task<ServiceRequestTrackingDto?> GetTrackingDetailsAsync(string requestNumber, string phoneNumber)
    {
        return await (
            from request in _dbContext.ServiceRequests
            join category in _dbContext.ServiceCategories
                on request.ServiceCategoryId equals category.ServiceCategoryId
            join status in _dbContext.ServiceStatuses
                on request.CurrentStatusId equals status.ServiceStatusId
            where request.RequestNumber == requestNumber
                && request.PhoneNumber == phoneNumber
                && request.DeletedAt == null
            select new ServiceRequestTrackingDto
            {
                RequestNumber = request.RequestNumber,
                CustomerName = request.CustomerName,
                PhoneNumber = request.PhoneNumber,

                ServiceCategory = category.CategoryName,
                CurrentStatus = status.StatusName,

                DeviceName = request.DeviceName,
                Brand = request.Brand,
                ModelName = request.ModelName,

                IssueDescription = request.IssueDescription,
                ServiceType = request.ServiceType,

                PreferredDate = request.PreferredDate,
                PreferredTimeSlot = request.PreferredTimeSlot,

                EstimatedPrice = request.EstimatedPrice,
                FinalPrice = request.FinalPrice,

                CreatedAt = request.CreatedAt
            }
        ).FirstOrDefaultAsync();
    }

    public async Task<PagedResultDto<AdminServiceRequestListItemDto>> GetAdminServiceRequestsAsync(AdminServiceRequestQueryDto query)
    {
        var pageNumber = Math.Max(query.PageNumber, 1);
        var pageSize = Math.Clamp(query.PageSize, 5, 50);

        var requestsQuery =
            from request in _dbContext.ServiceRequests.AsNoTracking()
            join category in _dbContext.ServiceCategories.AsNoTracking()
                on request.ServiceCategoryId equals category.ServiceCategoryId
            join status in _dbContext.ServiceStatuses.AsNoTracking()
                on request.CurrentStatusId equals status.ServiceStatusId
            where request.DeletedAt == null
            select new
            {
                request,
                category,
                status
            };

        if (query.StatusId.HasValue && query.StatusId.Value > 0)
        {
            requestsQuery = requestsQuery.Where(x => x.request.CurrentStatusId == query.StatusId.Value);
        }
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var searchText = query.Search!.Trim();

            requestsQuery = requestsQuery.Where(x =>
                x.request.RequestNumber.Contains(searchText) ||
                x.request.CustomerName.Contains(searchText) ||
                x.request.PhoneNumber.Contains(searchText));
        }

        var totalRecords = await requestsQuery.CountAsync();

        var items = await requestsQuery
        .OrderByDescending(x => x.request.CreatedAt)
        .Skip((pageNumber - 1) * pageSize)
        .Take(pageSize)
        .Select(x => new AdminServiceRequestListItemDto
        {
            ServiceRequestId = x.request.ServiceRequestId,
            RequestNumber = x.request.RequestNumber,
            CustomerName = x.request.CustomerName,
            PhoneNumber = x.request.PhoneNumber,
            ServiceCategory = x.category.CategoryName,
            CurrentStatus = x.status.StatusName,
            ServiceType = x.request.ServiceType,
            PreferredDate = x.request.PreferredDate,
            PreferredTimeSlot = x.request.PreferredTimeSlot!,
            CreatedAt = x.request.CreatedAt
        })
        .ToListAsync();

        var totalPages = (int)Math.Ceiling(totalRecords / (double)pageSize);

        return new PagedResultDto<AdminServiceRequestListItemDto>
        {
            Items = items,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalRecords = totalRecords,
            TotalPages = Math.Max(totalPages, 1)
        };
    }

    public async Task<AdminServiceRequestDetailsDto?> GetAdminServiceRequestByIdAsync(int serviceRequestId)
    {
        return await (
            from request in _dbContext.ServiceRequests
            join category in _dbContext.ServiceCategories
                on request.ServiceCategoryId equals category.ServiceCategoryId
            join status in _dbContext.ServiceStatuses
                on request.CurrentStatusId equals status.ServiceStatusId
            where request.ServiceRequestId == serviceRequestId
                  && request.DeletedAt == null
            select new AdminServiceRequestDetailsDto
            {
                ServiceRequestId = request.ServiceRequestId,
                RequestNumber = request.RequestNumber,

                CustomerName = request.CustomerName,
                PhoneNumber = request.PhoneNumber,
                Email = request.Email,

                ServiceCategory = category.CategoryName,
                CurrentStatus = status.StatusName,
                CurrentStatusId = status.ServiceStatusId,

                DeviceName = request.DeviceName,
                Brand = request.Brand,
                ModelName = request.ModelName,

                IssueDescription = request.IssueDescription,

                ServiceType = request.ServiceType,
                VisitAddress = request.VisitAddress,

                PreferredDate = request.PreferredDate,
                PreferredTimeSlot = request.PreferredTimeSlot,

                EstimatedPrice = request.EstimatedPrice,
                FinalPrice = request.FinalPrice,

                PaymentStatus = request.PaymentStatus,
                PaidAt = request.PaidAt,

                AdminNotes = request.AdminNotes,

                CreatedAt = request.CreatedAt,
                UpdatedAt = request.UpdatedAt,

                Diagnosis = request.Diagnosis,
                WorkNotes = request.WorkNotes,
                PartsUsed = request.PartsUsed,
                WarrantyNote = request.WarrantyNote,
                ShowRepairNotesToCustomer = request.ShowRepairNotesToCustomer,

                Images = request.ServiceRequestImages
                    .OrderByDescending(image => image.CreatedAt)
                    .Select(image => new AdminServiceRequestImageDto
                    {
                        ServiceRequestImageId = image.ServiceRequestImageId,
                        ImageUrl = image.ImageUrl,
                        OriginalFileName = image.OriginalFileName,
                        CreatedAt = image.CreatedAt
                    })
                    .ToList(),
                StatusHistory = _dbContext.ServiceRequestStatusHistories
                    .Where(history => history.ServiceRequestId == request.ServiceRequestId)
                    .OrderByDescending(history => history.ChangedAt)
                    .Select(history => new AdminServiceRequestStatusHistoryDto
                    {
                        OldStatus = history.OldStatusId == null
                        ? null
                        : _dbContext.ServiceStatuses
                            .Where(status => status.ServiceStatusId == history.OldStatusId)
                            .Select(status => status.StatusName)
                            .FirstOrDefault(),

                        NewStatus = _dbContext.ServiceStatuses
                            .Where(status => status.ServiceStatusId == history.NewStatusId)
                            .Select(status => status.StatusName)
                            .FirstOrDefault() ?? "Unknown",

                        Note = history.Note,
                        ChangedAt = history.ChangedAt
                    })
        .ToList()
            }
        ).FirstOrDefaultAsync();

    }

    public async Task<ServiceRequest?> GetServiceRequestEntityByIdAsync(int serviceRequestId)
    {
        return await _dbContext.ServiceRequests
            .FirstOrDefaultAsync(request =>
                request.ServiceRequestId == serviceRequestId && request.DeletedAt == null);
    }

    public async Task<bool> ServiceStatusExistAsync(int statusId)
    {
        return await _dbContext.ServiceStatuses
            .AnyAsync(status =>
                status.ServiceStatusId == statusId && status.IsActive);
    }

    public async Task<bool> UpdatePricingAsync(
    int id,
    decimal? estimatedPrice,
    decimal? finalPrice,
    string? adminNotes,
    string? paymentStatus
)
    {
        var request = await _dbContext.ServiceRequests
            .FirstOrDefaultAsync(request =>
                request.ServiceRequestId == id &&
                request.DeletedAt == null);

        if (request == null)
        {
            return false;
        }

        request.EstimatedPrice = estimatedPrice;
        request.FinalPrice = finalPrice;

        request.AdminNotes = string.IsNullOrWhiteSpace(adminNotes)
            ? null
            : adminNotes.Trim();

        if (!string.IsNullOrWhiteSpace(paymentStatus))
        {
            var cleanPaymentStatus = paymentStatus.Trim();

            if (
                cleanPaymentStatus != "Pending" &&
                cleanPaymentStatus != "Paid" &&
                cleanPaymentStatus != "Not Required"
            )
            {
                cleanPaymentStatus = "Pending";
            }

            request.PaymentStatus = cleanPaymentStatus;

            if (cleanPaymentStatus == "Paid")
            {
                request.PaidAt = DateTime.Now;
            }
            else
            {
                request.PaidAt = null;
            }
        }

        if (string.IsNullOrWhiteSpace(request.PaymentStatus))
        {
            request.PaymentStatus = "Pending";
            request.PaidAt = null;
        }

        request.UpdatedAt = DateTime.Now;

        await _dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<bool> ServiceRequestExistsAsync(int serviceRequestId)
    {
        return await _dbContext.ServiceRequests
            .AnyAsync(x => x.ServiceRequestId == serviceRequestId);
    }

    public async Task AddServiceRequestImagesAsync(List<ServiceRequestImage> images)
    {
        await _dbContext.ServiceRequestImages.AddRangeAsync(images);
    }

    public async Task<ServiceRequest?> GetServiceRequestDetailsWithImagesAsync(int serviceRequestId)
    {
        return await _dbContext.ServiceRequests
            .Include(x => x.ServiceRequestImages)
            .FirstOrDefaultAsync(x => x.ServiceRequestId == serviceRequestId);
    }

    public async Task<bool> UpdateRepairWorkNotesAsync(int id, string? diagnosis, string? workNotes, string? partsUsed, string? warrantyNote, bool showRepairNotesToCustomer)
    {
        var request = await _dbContext.ServiceRequests
            .FirstOrDefaultAsync(request =>
                request.ServiceRequestId == id &&
                request.DeletedAt == null);

        if (request == null) return false;

        request.Diagnosis = string.IsNullOrWhiteSpace(diagnosis)
            ? null
            : diagnosis.Trim();

        request.WorkNotes = string.IsNullOrWhiteSpace(workNotes)
            ? null
            : workNotes.Trim();

        request.PartsUsed = string.IsNullOrWhiteSpace(partsUsed)
            ? null
            : partsUsed.Trim();

        request.WarrantyNote = string.IsNullOrWhiteSpace(warrantyNote)
            ? null
            : warrantyNote.Trim();

        request.ShowRepairNotesToCustomer = showRepairNotesToCustomer;
        request.UpdatedAt = DateTime.Now;

        await _dbContext.SaveChangesAsync();
        return true;
    }
}