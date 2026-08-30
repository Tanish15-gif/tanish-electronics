using TanishElectronics.Api.Constants;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Admin.Enquiries;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.DTOs.Enquiries;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class EnquiryService : IEnquiryService
{
    private readonly IEnquiryRepository _repository;
    private readonly TanishElectronicsDbContext _dbContext;
    private readonly IAuditLogService _auditLogService;
    private readonly INotificationRealtimeNotifier _notificationNotifier;
    public EnquiryService(
        IEnquiryRepository repository,
        TanishElectronicsDbContext dbContext,
        IAuditLogService auditLogService,
        INotificationRealtimeNotifier notificationNotifier
    )
    {
        _repository = repository;
        _dbContext = dbContext;
        _auditLogService = auditLogService;
        _notificationNotifier = notificationNotifier;
    }

    public async Task<EnquiryCreatedDto> CreateAsync(CreateEnquiryDto dto)
    {
        Validate(dto);
        if (dto.ProductId.HasValue)
        {
            var productExists = await _repository.ProductExistsAsync(dto.ProductId.Value);

            if (!productExists)
            {
                throw new InvalidOperationException("Selected product was not found.");
            }
        }

        if (dto.ServiceRequestId.HasValue)
        {
            var requestExists = await _repository.ServiceRequestExistsAsync(dto.ServiceRequestId.Value);

            if (!requestExists)
            {
                throw new InvalidOperationException("Selected service request was not found.");
            }
        }
        var newStatusId = await _repository.GetStatusIdByNameAsync(EnquiryStatusNames.New);
        var enquiry = new Enquiry
        {
            ProductId = dto.ProductId,
            ServiceRequestId = dto.ServiceRequestId,

            FullName = dto.FullName.Trim(),
            PhoneNumber = dto.PhoneNumber.Trim(),
            Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim(),

            Subject = string.IsNullOrWhiteSpace(dto.Subject) ? null : dto.Subject.Trim(),
            Message = dto.Message.Trim(),

            EnquiryStatusId = newStatusId
        };

        await _repository.AddEnquiryAsync(enquiry);
        await _repository.SaveChangesAsync();

        var adminNotification = new AdminNotification
        {
            EnquiryId = enquiry.EnquiryId,
            ProductId = enquiry.ProductId,
            Title = "New product enquiry",
            Message = $"New product enquiry received from {enquiry.FullName}.",
            NotificationType = "Enquiry",
            IsRead = false,
            CreatedAt = DateTime.Now
        };
        await _dbContext.AdminNotifications.AddAsync(adminNotification);
        await _repository.SaveChangesAsync();

        await _notificationNotifier.NotifyAdminsAsync(new DTOs.Admin.Notifications.GetAdminNotificationDto
        {
            AdminNotificationId = adminNotification.AdminNotificationId,
            EnquiryId = adminNotification.EnquiryId,
            ProductId = adminNotification.ProductId,
            Title = adminNotification.Title,
            Message = adminNotification.Message,
            NotificationType = adminNotification.NotificationType,
            IsRead = false,
            CreatedAt = adminNotification.CreatedAt
        });

        return new EnquiryCreatedDto
        {
            EnquiryId = enquiry.EnquiryId,
            Status = EnquiryStatusNames.New,
            Message = "Enquiry submitted successfully."
        };
    }
    private static void Validate(CreateEnquiryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName))
        {
            throw new InvalidOperationException("Full name is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.PhoneNumber))
        {
            throw new InvalidOperationException("Phone number is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Message))
        {
            throw new InvalidOperationException("Message is required.");
        }
    }

    public async Task<PagedResultDto<AdminEnquiryListItemDto>> GetAdminEnquiriesAsync(AdminEnquiryQueryDto query)
    {
        query.PageNumber = Math.Max(query.PageNumber, 1);
        query.PageSize = Math.Clamp(query.PageSize, 5, 50);
        return await _repository.GetAdminEnquiriesAsync(query);
    }

    public async Task UpdateStatusAsync(int enquiryId, UpdateEnquiryStatusDto dto, int adminAppUserId)
    {
        if (dto.NewStatusId <= 0)
        {
            throw new InvalidOperationException("Invalid enquiry status selected.");
        }

        var statusExists = await _repository.EnquiryStatusExistsAsync(dto.NewStatusId);

        if (!statusExists)
        {
            throw new InvalidOperationException("Selected enquiry status does not exist.");
        }
        var enquiry = await _repository.GetEnquiryEntityByIdAsync(enquiryId);

        if (enquiry == null)
        {
            throw new KeyNotFoundException("Enquiry not found");
        }
        if (enquiry.EnquiryStatusId == dto.NewStatusId)
        {
            throw new InvalidOperationException("Enquiry is already in selected status.");
        }

        var oldStatusId = enquiry.EnquiryStatusId;
        enquiry.EnquiryStatusId = dto.NewStatusId;
        enquiry.UpdatedAt = DateTime.Now;
        await _repository.SaveChangesAsync();

        await _auditLogService.LogAsync(adminAppUserId,
        "UpdateStatus",
        "Enquiry",
        enquiryId,
        $"Enquiry status changed from status #{oldStatusId} to status #{dto.NewStatusId}."
        );
    }

    public async Task<AdminEnquiryDetailsDto> GetAdminEnquiryByIdAsync(int id)
    {
        var enquiry = await _repository.GetAdminEnquiryByIdAsync(id);

        if (enquiry == null)
        {
            throw new KeyNotFoundException("Enquiry not found");
        }
        return enquiry;
    }

    public async Task<List<EnquiryNoteDto>> GetEnquiryNotesAsync(int enquiryId)
    {
        var enquiry = await _repository.GetEnquiryEntityByIdAsync(enquiryId);

        if (enquiry == null)
        {
            throw new KeyNotFoundException("Enquiry not found.");
        }

        return await _repository.GetEnquiryNotesAsync(enquiryId);
    }

    public async Task<EnquiryNoteDto> AddEnquiryNoteAsync(int enquiryId, CreateEnquiryNoteDto dto)
    {
        var enquiry = await _repository.GetEnquiryEntityByIdAsync(enquiryId);

        if (enquiry == null)
        {
            throw new KeyNotFoundException("Enquiry not found.");
        }

        if (string.IsNullOrWhiteSpace(dto.Note))
        {
            throw new InvalidOperationException("Note is required.");
        }

        var cleanNote = dto.Note.Trim();

        if (cleanNote.Length > 1000)
        {
            throw new InvalidOperationException("Note cannot be more than 1000 characters.");
        }

        var enquiryNote = new EnquiryNote
        {
            EnquiryId = enquiryId,
            Note = cleanNote,
            CreatedAt = DateTime.Now
        };

        await _repository.AddEnquiryNoteAsync(enquiryNote);
        await _repository.SaveChangesAsync();

        return new EnquiryNoteDto
        {
            EnquiryNoteId = enquiryNote.EnquiryNoteId,
            EnquiryId = enquiryNote.EnquiryId,
            Note = enquiryNote.Note,
            CreatedAt = enquiryNote.CreatedAt
        };
    }
}