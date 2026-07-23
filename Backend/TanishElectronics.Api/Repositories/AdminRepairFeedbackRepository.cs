using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Admin.Feedback;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.Interfaces.Repositories;

namespace TanishElectronics.Api.Repositories;

public class AdminRepairFeedbackRepository : IAdminRepairFeedbackRepository
{
    private readonly TanishElectronicsDbContext _dbContext;
    public AdminRepairFeedbackRepository(TanishElectronicsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResultDto<AdminRepairFeedbackDto>> GetAllAsync(AdminFeedbackQueryDto query)
    {
        query ??= new AdminFeedbackQueryDto();

        query.PageNumber = Math.Max(query.PageNumber, 1);
        query.PageSize = Math.Clamp(query.PageSize, 1, 50);

        var feedbackQuery =
            from feedback in _dbContext.CustomerRepairFeedbacks.AsNoTracking()
            join request in _dbContext.ServiceRequests.AsNoTracking()
                on feedback.ServiceRequestId equals request.ServiceRequestId
            join category in _dbContext.ServiceCategories.AsNoTracking()
                on request.ServiceCategoryId equals category.ServiceCategoryId
            join status in _dbContext.ServiceStatuses.AsNoTracking()
                on request.CurrentStatusId equals status.ServiceStatusId
            where request.DeletedAt == null
            select new
            {
                feedback,
                request,
                category,
                status
            };

        if (query.IsPublic.HasValue)
        {
            feedbackQuery = feedbackQuery.Where(x => x.feedback.IsPublic == query.IsPublic.Value);
        }

        if (query.Rating.HasValue && query.Rating.Value > 0)
        {
            feedbackQuery = feedbackQuery.Where(x => x.feedback.Rating == query.Rating.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var searchText = query.Search.Trim();

            feedbackQuery = feedbackQuery.Where(x =>
                x.request.RequestNumber.Contains(searchText) ||
                x.request.CustomerName.Contains(searchText) ||
                x.request.PhoneNumber.Contains(searchText) ||
                (x.feedback.Comment != null &&
                 x.feedback.Comment.Contains(searchText))
            );
        }

        var totalRecords = await feedbackQuery.CountAsync();

        var totalPages = (int)Math.Ceiling(
            totalRecords / (double)query.PageSize
        );

        var items = await feedbackQuery
            .OrderByDescending(x => x.feedback.CreatedAt)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(x => new AdminRepairFeedbackDto
            {
                CustomerRepairFeedbackId = x.feedback.CustomerRepairFeedbackId,

                ServiceRequestId = x.request.ServiceRequestId,
                RequestNumber = x.request.RequestNumber,

                CustomerName = x.request.CustomerName,
                PhoneNumber = x.request.PhoneNumber,
                Email = x.request.Email,

                ServiceCategory = x.category.CategoryName,
                CurrentStatus = x.status.StatusName,

                Rating = x.feedback.Rating,
                Comment = x.feedback.Comment,

                IsPublic = x.feedback.IsPublic,

                CreatedAt = x.feedback.CreatedAt,
                UpdatedAt = x.feedback.UpdatedAt
            })
            .ToListAsync();

        return new PagedResultDto<AdminRepairFeedbackDto>
        {
            Items = items,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            TotalRecords = totalRecords,
            TotalPages = Math.Max(totalPages, 1)
        };
    }

    public async Task<bool> UpdatePublicStatusAsync(int feedbackId, bool isPublic)
    {
        var feedback = await _dbContext.CustomerRepairFeedbacks
            .FirstOrDefaultAsync(feedback =>
                feedback.CustomerRepairFeedbackId == feedbackId);

        if (feedback == null) return false;


        feedback.IsPublic = isPublic;
        feedback.UpdatedAt = DateTime.Now;

        await _dbContext.SaveChangesAsync();
        return true;
    }
}