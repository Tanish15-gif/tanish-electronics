using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Customer.Feedback;
using TanishElectronics.Api.DTOs.Customer.Repairs;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;

namespace TanishElectronics.Api.Repositories;

public class CustomerRepairsRepository : ICustomerRepairsRepository
{
    private readonly TanishElectronicsDbContext _context;

    public CustomerRepairsRepository(TanishElectronicsDbContext context)
    {
        _context = context;
    }

    public async Task<CustomerRepairFeedbackDto?> GetFeedbackAsync(int serviceRequestId, int customerId)
    {
        return await _context.CustomerRepairFeedbacks
        .Where(feedback =>
            feedback.ServiceRequestId == serviceRequestId &&
            feedback.CustomerId == customerId)
        .Select(feedback => new CustomerRepairFeedbackDto
        {
            CustomerRepairFeedbackId = feedback.CustomerRepairFeedbackId,
            ServiceRequestId = feedback.ServiceRequestId,
            Rating = feedback.Rating,
            Comment = feedback.Comment,
            IsPublic = feedback.IsPublic,
            CreatedAt = feedback.CreatedAt,
            UpdatedAt = feedback.UpdatedAt
        })
        .FirstOrDefaultAsync();
    }

    public async Task<CustomerRepairDetailsDto?> GetRepairDetailsAsync(
        int serviceRequestId,
        int customerId
    )
    {
        return await _context.ServiceRequests
            .Where(request =>
                request.ServiceRequestId == serviceRequestId &&
                request.CustomerId == customerId &&
                request.DeletedAt == null
            )
            .Select(request => new CustomerRepairDetailsDto
            {
                ServiceRequestId = request.ServiceRequestId,
                RequestNumber = request.RequestNumber,

                CustomerName = request.CustomerName,
                PhoneNumber = request.PhoneNumber,
                Email = request.Email,

                ServiceCategory = request.ServiceCategory.CategoryName,
                CurrentStatus = request.CurrentStatus.StatusName,

                DeviceName = request.DeviceName,
                Brand = request.Brand,
                ModelName = request.ModelName,

                IssueDescription = request.IssueDescription,
                ServiceType = request.ServiceType,

                VisitAddress =
                    request.CustomerAddress != null
                        ? request.CustomerAddress.AddressLine + ", " +
                          request.CustomerAddress.City + ", " +
                          request.CustomerAddress.State + " - " +
                          request.CustomerAddress.Pincode
                        : request.VisitAddress,

                PreferredDate = request.PreferredDate,
                PreferredTimeSlot = request.PreferredTimeSlot,

                EstimatedPrice = request.EstimatedPrice,
                FinalPrice = request.FinalPrice,

                PaymentStatus = request.PaymentStatus,
                PaidAt = request.PaidAt,

                ShowRepairNotesToCustomer = request.ShowRepairNotesToCustomer,

                Diagnosis = request.ShowRepairNotesToCustomer
                    ? request.Diagnosis
                    : null,

                WorkNotes = request.ShowRepairNotesToCustomer
                    ? request.WorkNotes
                    : null,

                PartsUsed = request.ShowRepairNotesToCustomer
                    ? request.PartsUsed
                    : null,

                WarrantyNote = request.ShowRepairNotesToCustomer
                    ? request.WarrantyNote
                    : null,

                CreatedAt = request.CreatedAt,
                UpdatedAt = request.UpdatedAt,
                CompletedAt = request.CompletedAt,
                CancelledAt = request.CancelledAt,

                Images = request.ServiceRequestImages
                    .OrderByDescending(image => image.CreatedAt)
                    .Select(image => new CustomerRepairImageDto
                    {
                        ServiceRequestImageId = image.ServiceRequestImageId,
                        ImageUrl = image.ImageUrl,
                        OriginalFileName = image.OriginalFileName,
                        CreatedAt = image.CreatedAt
                    })
                    .ToList(),

                StatusHistory = request.ServiceRequestStatusHistories
                    .OrderBy(history => history.ChangedAt)
                    .Select(history => new CustomerRepairStatusHistoryDto
                    {
                        StatusHistoryId = history.StatusHistoryId,
                        OldStatus = history.OldStatus == null
                            ? null
                            : history.OldStatus.StatusName,
                        NewStatus = history.NewStatus.StatusName,
                        ChangedByName = history.ChangedByAppUser == null
                            ? null
                            : history.ChangedByAppUser.FullName,
                        Note = history.Note,
                        ChangedAt = history.ChangedAt
                    })
                    .ToList(),

                Feedback = _context.CustomerRepairFeedbacks
                    .Where(feedback =>
                        feedback.ServiceRequestId == request.ServiceRequestId &&
                        feedback.CustomerId == customerId)
                    .Select(feedback => new CustomerRepairFeedbackDto
                    {
                        CustomerRepairFeedbackId = feedback.CustomerRepairFeedbackId,
                        ServiceRequestId = feedback.ServiceRequestId,
                        Rating = feedback.Rating,
                        Comment = feedback.Comment,
                        IsPublic = feedback.IsPublic,
                        CreatedAt = feedback.CreatedAt,
                        UpdatedAt = feedback.UpdatedAt,
                    }).FirstOrDefault()
            })
            .FirstOrDefaultAsync();
    }

    public async Task<string?> GetRepairStatusNameAsync(int serviceRequestId, int customerId)
    {
        return await _context.ServiceRequests
            .Where(request =>
                request.ServiceRequestId == serviceRequestId &&
                request.CustomerId == customerId &&
                request.DeletedAt == null)
            .Select(request => request.CurrentStatus.StatusName)
            .FirstOrDefaultAsync();
    }

    public async Task<CustomerRepairFeedbackDto> UpsertFeedbackAsync(int serviceRequestId, int customerId, int rating, string? comment)
    {
        var feedback = await _context.CustomerRepairFeedbacks
        .FirstOrDefaultAsync(feedback =>
            feedback.ServiceRequestId == serviceRequestId &&
            feedback.CustomerId == customerId);

        if (feedback == null)
        {
            feedback = new CustomerRepairFeedback
            {
                ServiceRequestId = serviceRequestId,
                CustomerId = customerId,
                Rating = rating,
                Comment = string.IsNullOrWhiteSpace(comment)
                    ? null
                    : comment.Trim(),
                IsPublic = false,
                CreatedAt = DateTime.Now
            };

            await _context.CustomerRepairFeedbacks.AddAsync(feedback);
        }
        else
        {
            feedback.Rating = rating;
            feedback.Comment = string.IsNullOrWhiteSpace(comment)
                ? null
                : comment.Trim();
            feedback.UpdatedAt = DateTime.Now;
        }
        var isNewFeedback = feedback == null;

        var request = await _context.ServiceRequests
            .FirstOrDefaultAsync(request =>
        request.ServiceRequestId == serviceRequestId &&
        request.CustomerId == customerId &&
        request.DeletedAt == null);

        if (request != null && isNewFeedback)
        {
            await _context.AdminNotifications.AddAsync(new AdminNotification
            {
                ServiceRequestId = serviceRequestId,
                Title = "New customer feedback",
                Message = $"{request.CustomerName} gave {rating}/5 feedback for {request.RequestNumber}.",
                NotificationType = "Feedback",
                IsRead = false,
                CreatedAt = DateTime.Now
            });
        }

        await _context.SaveChangesAsync();

        return new CustomerRepairFeedbackDto
        {
            CustomerRepairFeedbackId = feedback!.CustomerRepairFeedbackId,
            ServiceRequestId = feedback.ServiceRequestId,
            Rating = feedback.Rating,
            Comment = feedback.Comment,
            IsPublic = feedback.IsPublic,
            CreatedAt = feedback.CreatedAt,
            UpdatedAt = feedback.UpdatedAt
        };
    }
    public async Task<List<CustomerRepairFeedbackCenterItemDto>> GetFeedbackCenterAsync(
    int customerId
)
    {
        return await _context.ServiceRequests
            .Where(request =>
                request.CustomerId == customerId &&
                request.DeletedAt == null)
            .OrderByDescending(request => request.CreatedAt)
            .Select(request => new CustomerRepairFeedbackCenterItemDto
            {
                ServiceRequestId = request.ServiceRequestId,
                RequestNumber = request.RequestNumber,

                ServiceCategory = request.ServiceCategory.CategoryName,
                CurrentStatus = request.CurrentStatus.StatusName,

                DeviceName = request.DeviceName,
                Brand = request.Brand,
                ModelName = request.ModelName,

                CreatedAt = request.CreatedAt,
                CompletedAt = request.CompletedAt,

                CanGiveFeedback = request.CurrentStatus.StatusName
                    .ToLower()
                    .Contains("completed"),

                HasFeedback = _context.CustomerRepairFeedbacks
                    .Any(feedback =>
                        feedback.ServiceRequestId == request.ServiceRequestId &&
                        feedback.CustomerId == customerId),

                Rating = _context.CustomerRepairFeedbacks
                    .Where(feedback =>
                        feedback.ServiceRequestId == request.ServiceRequestId &&
                        feedback.CustomerId == customerId)
                    .Select(feedback => (int?)feedback.Rating)
                    .FirstOrDefault(),

                Comment = _context.CustomerRepairFeedbacks
                    .Where(feedback =>
                        feedback.ServiceRequestId == request.ServiceRequestId &&
                        feedback.CustomerId == customerId)
                    .Select(feedback => feedback.Comment)
                    .FirstOrDefault()
            })
            .ToListAsync();
    }
}