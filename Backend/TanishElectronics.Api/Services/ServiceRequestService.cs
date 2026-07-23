using Microsoft.AspNetCore.StaticAssets;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Admin.ServiceRequests;
using TanishElectronics.Api.DTOs.ServiceRequests;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using TanishElectronics.Api.DTOs.Common;

namespace TanishElectronics.Api.Services;

public class ServiceRequestService : IServiceRequestService
{
    private readonly IServiceRequestRepository _repository;
    private readonly TanishElectronicsDbContext _dbContext;
    private readonly IWebHostEnvironment _environment;
    private readonly ICustomerAccountResolver _customerAccountResolver;
    public ServiceRequestService
    (
        IServiceRequestRepository repository,
        IWebHostEnvironment environment,
        ICustomerAccountResolver customerAccountResolver,
        TanishElectronicsDbContext dbContext
    )
    {
        _repository = repository;
        _environment = environment;
        _customerAccountResolver = customerAccountResolver;
        _dbContext = dbContext;
    }

    public async Task<ServiceRequestCreatedDto> CreateAsync(CreateServiceRequestDto dto)
    {
        ValidateBasicDetails(dto);

        var isCategoryActive = await _repository.IsServiceCategoryActiveAsync(dto.ServiceCategoryId);

        if (!isCategoryActive)
        {
            throw new InvalidOperationException("Selected service category is not available.");
        }
        if (dto.ServiceType == "Home Visit")
        {
            if (dto.ServiceType == null)
            {
                throw new InvalidOperationException("Please select your service location.");
            }
            var isLoctionAvailable = await _repository.IsServiceLocationAvailableAsync(dto.ServiceLocationId!.Value);
            if (!isLoctionAvailable)
            {
                throw new InvalidOperationException("Home visit is not available for this location.");
            }
            if (string.IsNullOrWhiteSpace(dto.VisitAddress))
            {
                throw new InvalidOperationException("Visit address is required for home visit.");
            }
        }
        var pendingStatusId = await _repository.GetStatusIdByNameAsync(ServiceStatusName.Pending);
        var customer = await _repository.GetCustomerByPhoneAsync(dto.PhoneNumber.Trim());

        if (customer == null)
        {
            customer = new Customer
            {
                FullName = dto.CustomerName.Trim(),
                PhoneNumber = dto.PhoneNumber.Trim(),
                Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim(),
                IsActive = true
            };

            await _repository.AddCustomerAsync(customer);
            await _repository.SaveChangesAsync();
        }
        var requestNumber = await _repository.GenerateRequestNumberAsync();

        var serviceRequest = new ServiceRequest
        {
            RequestNumber = requestNumber,
            CustomerId = customer.CustomerId,

            CustomerName = dto.CustomerName.Trim(),
            PhoneNumber = dto.PhoneNumber.Trim(),
            Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim(),

            ServiceCategoryId = dto.ServiceCategoryId,
            ServiceLocationId = dto.ServiceLocationId,

            DeviceName = string.IsNullOrWhiteSpace(dto.DeviceName) ? null : dto.DeviceName.Trim(),
            Brand = string.IsNullOrWhiteSpace(dto.Brand) ? null : dto.Brand.Trim(),
            ModelName = string.IsNullOrWhiteSpace(dto.ModelName) ? null : dto.ModelName.Trim(),

            IssueDescription = dto.IssueDescription.Trim(),

            ServiceType = dto.ServiceType,

            VisitAddress = string.IsNullOrWhiteSpace(dto.VisitAddress) ? null : dto.VisitAddress.Trim(),
            PreferredDate = dto.PreferredDate,
            PreferredTimeSlot = string.IsNullOrWhiteSpace(dto.PreferredTimeSlot) ? null : dto.PreferredTimeSlot.Trim(),

            CurrentStatusId = pendingStatusId
        };

        var currentCustomer = await _customerAccountResolver.GetCurrentCustomerAsync();

        if (currentCustomer != null)
        {
            serviceRequest.CustomerId = currentCustomer.CustomerId;
            if (dto.CustomerAddressId.HasValue && dto.CustomerAddressId.Value > 0)
            {
                var selectedAddress = await _dbContext.CustomerAddresses
                    .FirstOrDefaultAsync(address =>
                        address.CustomerAddressId == dto.CustomerAddressId.Value &&
                        address.CustomerId == currentCustomer.CustomerId &&
                        address.IsActive);

                if (selectedAddress == null)
                {
                    throw new InvalidOperationException("Selected address was not found.");
                }

                serviceRequest.CustomerAddressId = selectedAddress.CustomerAddressId;

                if (string.IsNullOrWhiteSpace(serviceRequest.VisitAddress))
                {
                    serviceRequest.VisitAddress =
                        $"{selectedAddress.AddressLine}, {selectedAddress.City}, {selectedAddress.State}, {selectedAddress.Pincode}";
                }
            }
            else
            {
                var defaultAddress = await _customerAccountResolver.GetDefaultAddressAsync(
                    currentCustomer.CustomerId
                );

                if (defaultAddress != null && defaultAddress.CustomerAddressId > 0)
                {
                    serviceRequest.CustomerAddressId = defaultAddress.CustomerAddressId;
                }
            }
        }
        await _repository.AddServiceRequestAsync(serviceRequest);
        await _repository.SaveChangesAsync();

        var history = new ServiceRequestStatusHistory
        {
            ServiceRequestId = serviceRequest.ServiceRequestId,
            OldStatusId = null,
            NewStatusId = pendingStatusId,
            ChangedByAppUserId = null,
            Note = "Service request created by customer."
        };
        await _repository.AddStatusHistoryAsync(history);

        await _dbContext.AdminNotifications.AddAsync(new AdminNotification
        {
            ServiceRequestId = serviceRequest.ServiceRequestId,
            Title = "New repair Request",
            Message = $"New repair request {serviceRequest.RequestNumber} from {serviceRequest.CustomerName}.",
            NotificationType = "Repair",
            IsRead = false,
            CreatedAt = DateTime.Now
        });
        await _repository.SaveChangesAsync();

        return new ServiceRequestCreatedDto
        {
            ServiceRequestId = serviceRequest.ServiceRequestId,
            RequestNumber = serviceRequest.RequestNumber,
            Status = ServiceStatusName.Pending,
            Message = "Service request created successfully."
        };
    }

    private static void ValidateBasicDetails(CreateServiceRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CustomerName))
        {
            throw new InvalidOperationException("Customer name is required.");
        }
        if (string.IsNullOrWhiteSpace(dto.PhoneNumber))
        {
            throw new InvalidOperationException("PhoneNumber is required.");
        }
        if (string.IsNullOrWhiteSpace(dto.IssueDescription))
        {
            throw new InvalidOperationException("Issue Description is required.");
        }
        if (dto.ServiceType != "Home Visit" && dto.ServiceType != "Shop Repair")
        {
            throw new InvalidOperationException("Invalid Service type.");
        }

    }

    public async Task<ServiceRequestTrackingDto> TrackAsync(TrackServiceRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RequestNumber))
        {
            throw new InvalidOperationException("Request number is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.PhoneNumber))
        {
            throw new InvalidOperationException("Phone number is required.");
        }

        var trackingDetails = await _repository.GetTrackingDetailsAsync(dto.RequestNumber.Trim(), dto.PhoneNumber.Trim());

        if (trackingDetails == null)
        {
            throw new InvalidOperationException("No service request found with this request number and phone number.");
        }
        return trackingDetails;
    }

    public async Task<PagedResultDto<AdminServiceRequestListItemDto>> GetAdminServiceRequestsAsync(AdminServiceRequestQueryDto query)
    {
        query.PageNumber = Math.Max(query.PageNumber, 1);
        query.PageSize = Math.Clamp(query.PageSize, 5, 50);

        return await _repository.GetAdminServiceRequestsAsync(query);
    }

    public async Task<AdminServiceRequestDetailsDto> GetAdminServiceRequestByIdAsync(int serviceRequestId)
    {
        var request = await _repository.GetAdminServiceRequestByIdAsync(serviceRequestId);
        if (request == null)
        {
            throw new KeyNotFoundException("Service request not found.");
        }
        return request;
    }

    public async Task UpdateStatusAsync(int serviceRequestId, UpdateServiceRequestStatusDto dto)
    {
        if (dto.NewStatusId <= 0)
        {
            throw new InvalidOperationException("Invalid status selected.");
        }

        var request = await _repository.GetServiceRequestEntityByIdAsync(
            serviceRequestId
        );

        if (request == null)
        {
            throw new KeyNotFoundException("Service request not found.");
        }

        var currentStatus = await _dbContext.ServiceStatuses
            .AsNoTracking()
            .Where(status => status.ServiceStatusId == request.CurrentStatusId)
            .FirstOrDefaultAsync();

        var newStatus = await _dbContext.ServiceStatuses
            .AsNoTracking()
            .Where(status => status.ServiceStatusId == dto.NewStatusId)
            .FirstOrDefaultAsync();

        if (newStatus == null)
        {
            throw new InvalidOperationException("Selected status does not exist.");
        }

        if (request.CurrentStatusId == dto.NewStatusId)
        {
            throw new InvalidOperationException(
                "Request is already in selected status."
            );
        }

        string currentStatusLower = (currentStatus?.StatusName ?? "")
            .ToLower();

        string newStatusLower = (newStatus.StatusName ?? "")
            .ToLower();

        bool isCurrentTerminal =
            currentStatusLower.Contains("completed") ||
            currentStatusLower.Contains("cancelled");

        if (isCurrentTerminal && !dto.IsCorrection)
        {
            throw new InvalidOperationException(
                "This request is already completed/cancelled. Mark this update as a correction to change it."
            );
        }

        if (isCurrentTerminal && string.IsNullOrWhiteSpace(dto.Note))
        {
            throw new InvalidOperationException(
                "Correction note is required when changing a completed or cancelled request."
            );
        }

        var oldStatusId = request.CurrentStatusId;

        request.CurrentStatusId = dto.NewStatusId;
        request.UpdatedAt = DateTime.Now;

        if (newStatusLower.Contains("completed"))
        {
            request.CompletedAt = DateTime.Now;
            request.CancelledAt = null;
        }
        else if (newStatusLower.Contains("cancelled"))
        {
            request.CancelledAt = DateTime.Now;
            request.CompletedAt = null;
        }
        else
        {
            request.CompletedAt = null;
            request.CancelledAt = null;
        }

        var cleanNote = string.IsNullOrWhiteSpace(dto.Note)
            ? null
            : dto.Note.Trim();

        var history = new ServiceRequestStatusHistory
        {
            ServiceRequestId = request.ServiceRequestId,
            OldStatusId = oldStatusId,
            NewStatusId = dto.NewStatusId,
            ChangedByAppUserId = null,
            Note = dto.IsCorrection && cleanNote != null
                ? $"Correction: {cleanNote}"
                : cleanNote,
            ChangedAt = DateTime.Now
        };
        if (request.CustomerId != null)
        {
            var notificationTitle = "Repair status updated";
            var notificationMessage = $"Your repair {request.RequestNumber} is now {newStatus.StatusName}";

            if (newStatusLower.Contains("completed"))
            {
                notificationTitle = "Feedback updated";
                notificationMessage = $"Your repair {request.RequestNumber} is completed. Please share your feedback.";
            }
            var notification = new CustomerNotification
            {
                CustomerId = request.CustomerId.Value,
                ServiceRequestId = request.ServiceRequestId,
                Title = notificationTitle,
                Message = notificationMessage,
                IsRead = false,
                CreatedAt = DateTime.Now
            };
            await _dbContext.CustomerNotifications.AddAsync(notification);
        }


        await _repository.AddStatusHistoryAsync(history);
        await _repository.SaveChangesAsync();
    }

    public async Task UpdateServiceRequestPricingAsync(
     int id,
     UpdateServiceRequestPricingDto dto
 )
    {
        if (dto.EstimatedPrice.HasValue && dto.EstimatedPrice.Value < 0)
        {
            throw new InvalidOperationException("Estimated price cannot be negative.");
        }

        if (dto.FinalPrice.HasValue && dto.FinalPrice.Value < 0)
        {
            throw new InvalidOperationException("Final price cannot be negative.");
        }

        var updated = await _repository.UpdatePricingAsync(
            id,
            dto.EstimatedPrice,
            dto.FinalPrice,
            dto.AdminNotes,
            dto.PaymentStatus
        );

        if (!updated)
        {
            throw new KeyNotFoundException("Service request not found.");
        }

        var request = await _repository.GetServiceRequestEntityByIdAsync(id);

        if (request != null && request.CustomerId != null)
        {
            var title = "Repair pricing updated";
            var message = $"Pricing has been updated for repair {request.RequestNumber}.";

            if (dto.PaymentStatus == "Paid")
            {
                title = "Payment marked as paid";
                message = $"Payment has been marked as paid for repair {request.RequestNumber}.";
            }
            else if (dto.FinalPrice.HasValue)
            {
                message = $"Final price updated for repair {request.RequestNumber}: ₹{dto.FinalPrice.Value}.";
            }
            else if (dto.EstimatedPrice.HasValue)
            {
                message = $"Estimated price updated for repair {request.RequestNumber}: ₹{dto.EstimatedPrice.Value}.";
            }

            var notification = new CustomerNotification
            {
                CustomerId = request.CustomerId.Value,
                ServiceRequestId = request.ServiceRequestId,
                Title = title,
                Message = message,
                IsRead = false,
                CreatedAt = DateTime.Now
            };

            await _dbContext.CustomerNotifications.AddAsync(notification);
            await _dbContext.SaveChangesAsync();
        }
    }

    public async Task<UploadServiceRequestImagesResultDto> UploadImageAsync(int serviceRequestId, List<IFormFile> images)
    {
        var serviceRequestExists = await _repository.ServiceRequestExistsAsync(serviceRequestId);

        if (!serviceRequestExists)
        {
            throw new KeyNotFoundException("Service request not found");
        }
        if (images == null || images.Count == 0)
        {
            throw new InvalidOperationException("No images uploaded.");
        }

        if (images.Count > 5)
        {
            throw new InvalidOperationException("Maximum 5 images are allowed.");
        }
        string[] allowedContentTypes =
        {
            "image/jpeg",
        "image/png",
        "image/webp"
        };
        const long maxFileSize = 5 * 1024 * 1024;
        var webRootPath = _environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRootPath))
        {
            webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }
        var uploadfolder = Path.Combine(
            webRootPath,
            "uploads",
            "service-requests",
            serviceRequestId.ToString()
        );
        Directory.CreateDirectory(uploadfolder);

        var imageUrls = new List<string>();

        var serviceRequestImage = new List<ServiceRequestImage>();

        foreach (var image in images)
        {
            if (image.Length == 0)
            {
                continue;
            }

            if (image.Length > maxFileSize)
            {
                throw new InvalidOperationException("Each image must be less than 5MB.");
            }

            if (!allowedContentTypes.Contains(image.ContentType))
            {
                throw new InvalidOperationException("Only JPG, PNG and WEBP images are allowed.");
            }
            var extension = Path.GetExtension(image.FileName).ToLowerInvariant();

            var safeFileName = $"{Guid.NewGuid()}{extension}";

            var filePath = Path.Combine(uploadfolder, safeFileName);

            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await image.CopyToAsync(stream);
            }
            var imageUrl = $"/uploads/service-requests/{serviceRequestId}/{safeFileName}";
            imageUrls.Add(imageUrl);

            serviceRequestImage.Add(new ServiceRequestImage
            {
                ServiceRequestId = serviceRequestId,
                ImageUrl = imageUrl,
                OriginalFileName = image.FileName,
                CreatedAt = DateTime.UtcNow
            });
        }
        await _repository.AddServiceRequestImagesAsync(serviceRequestImage);

        await _repository.SaveChangesAsync();
        return new UploadServiceRequestImagesResultDto
        {
            Message = "Image Uploaded successFully",
            ImageUrls = imageUrls
        };
    }

    public async Task UpdateRepairWorkNotesAsync(int id, UpdateRepairWorkNotesDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Diagnosis) && dto.Diagnosis!.Trim().Length > 1000)
        {
            throw new InvalidOperationException("Diagnosis cannot be more than 1000 characters.");
        }
        if (string.IsNullOrWhiteSpace(dto.WorkNotes) && dto.WorkNotes!.Trim().Length > 1500)
        {
            throw new InvalidOperationException("Work notes cannot be more than 1500 characters.");
        }
        if (string.IsNullOrWhiteSpace(dto.PartsUsed) && dto.PartsUsed!.Trim().Length > 1000)
        {
            throw new InvalidOperationException("Parts used cannot be more than 1000 characters.");
        }
        if (string.IsNullOrWhiteSpace(dto.WarrantyNote) && dto.WarrantyNote!.Trim().Length > 500)
        {
            throw new InvalidOperationException("Warranty note cannot be more than 500 characters.");
        }
        var updated = await _repository.UpdateRepairWorkNotesAsync(
            id, dto.Diagnosis, dto.WorkNotes, dto.PartsUsed, dto.WarrantyNote, dto.ShowRepairNotesToCustomer
        );

        if (!updated) throw new KeyNotFoundException("Service request not found");
    }
}