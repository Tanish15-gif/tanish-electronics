using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Admin.AuditLogs;
using TanishElectronics.Api.DTOs.Admin.Enquiries;
using TanishElectronics.Api.DTOs.Admin.Exports;
using TanishElectronics.Api.DTOs.Admin.ServiceRequests;
using TanishElectronics.Api.Interfaces.Repositories;

namespace TanishElectronics.Api.Repositories;

public class AdminExportRepository : IAdminExportRepository
{
    private readonly TanishElectronicsDbContext _dbContext;
    public AdminExportRepository(TanishElectronicsDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task<List<AuditLogExportRowDto>> GetAuditLogsForExportAsync(AdminAuditLogQueryDto query, int maxRows)
    {
        query ??= new AdminAuditLogQueryDto();
        maxRows = Math.Clamp(maxRows, 1, 5000);

        var auditQuery =
            from auditLog in _dbContext.AuditLogs.AsNoTracking()
            join appUser in _dbContext.AppUsers.AsNoTracking()
                on auditLog.AppUserId equals appUser.AppUserId into appUserJoin
            from appUser in appUserJoin.DefaultIfEmpty()
            select new
            {
                auditLog,
                appUser
            };

        if (!string.IsNullOrWhiteSpace(query.Action))
        {
            var action = query.Action.Trim();

            auditQuery = auditQuery.Where(x =>
                x.auditLog.Action == action
            );
        }

        if (!string.IsNullOrWhiteSpace(query.EntityName))
        {
            var entityName = query.EntityName.Trim();

            auditQuery = auditQuery.Where(x =>
                x.auditLog.EntityName == entityName
            );
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();

            auditQuery = auditQuery.Where(x =>
                x.auditLog.Action.Contains(search) ||
                x.auditLog.EntityName.Contains(search) ||
                (x.auditLog.Description != null &&
                    x.auditLog.Description.Contains(search)) ||
                (x.auditLog.IpAddress != null &&
                    x.auditLog.IpAddress.Contains(search)) ||
                (
                    x.appUser != null &&
                    (
                        x.appUser.FullName.Contains(search) ||
                        x.appUser.Email.Contains(search)
                    )
                )
            );
        }

        return await auditQuery
            .OrderByDescending(x => x.auditLog.CreatedAt)
            .Take(maxRows)
            .Select(x => new AuditLogExportRowDto
            {
                AuditLogId = x.auditLog.AuditLogId,
                Action = x.auditLog.Action,
                EntityName = x.auditLog.EntityName,
                EntityId = x.auditLog.EntityId,
                Description = x.auditLog.Description,

                AdminName = x.appUser != null ? x.appUser.FullName : "System",
                AdminEmail = x.appUser != null ? x.appUser.Email : null,

                IpAddress = x.auditLog.IpAddress,
                UserAgent = x.auditLog.UserAgent,

                CreatedAt = x.auditLog.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<ServiceRequestExportRowDto>> GetServiceRequestsForExportAsync(AdminServiceRequestQueryDto query, int maxRows)
    {
        query ??= new AdminServiceRequestQueryDto();
        maxRows = Math.Clamp(maxRows, 1, 5000);
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
            requestsQuery = requestsQuery.Where(x =>
                x.request.CurrentStatusId == query.StatusId.Value
            );
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();

            requestsQuery = requestsQuery.Where(x =>
                x.request.RequestNumber.Contains(search) ||
                x.request.CustomerName.Contains(search) ||
                x.request.PhoneNumber.Contains(search)
            );
        }

        return await requestsQuery
            .OrderByDescending(x => x.request.CreatedAt)
            .Take(maxRows)
            .Select(x => new ServiceRequestExportRowDto
            {
                ServiceRequestId = x.request.ServiceRequestId,
                RequestNumber = x.request.RequestNumber,

                CustomerName = x.request.CustomerName,
                PhoneNumber = x.request.PhoneNumber,

                ServiceCategory = x.category.CategoryName,
                CurrentStatus = x.status.StatusName,
                ServiceType = x.request.ServiceType,

                PreferredDate = x.request.PreferredDate,
                PreferredTimeSlot = x.request.PreferredTimeSlot,

                CreatedAt = x.request.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<EnquiryExportRowDto>> GetEnquiriesForExportAsync(AdminEnquiryQueryDto query, int maxRows)
    {

        query ??= new AdminEnquiryQueryDto();
        maxRows = Math.Clamp(maxRows, 1, 5000);

        var enquiriesQuery =
            from enquiry in _dbContext.Enquiries.AsNoTracking()
            join status in _dbContext.EnquiryStatuses.AsNoTracking()
                on enquiry.EnquiryStatusId equals status.EnquiryStatusId
            join product in _dbContext.Products.AsNoTracking()
                on enquiry.ProductId equals product.ProductId into productJoin
            from product in productJoin.DefaultIfEmpty()
            where enquiry.DeletedAt == null
            select new
            {
                enquiry,
                status,
                product
            };

        if (query.StatusId.HasValue && query.StatusId.Value > 0)
        {
            enquiriesQuery = enquiriesQuery.Where(x =>
                x.enquiry.EnquiryStatusId == query.StatusId.Value
            );
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();

            enquiriesQuery = enquiriesQuery.Where(x =>
                x.enquiry.FullName.Contains(search) ||
                x.enquiry.PhoneNumber.Contains(search) ||
                (
                    x.enquiry.Email != null &&
                    x.enquiry.Email.Contains(search)
                ) ||
                (
                    x.product != null &&
                    x.product.ProductName.Contains(search)
                )
            );
        }

        return await enquiriesQuery
            .OrderByDescending(x => x.enquiry.CreatedAt)
            .Take(maxRows)
            .Select(x => new EnquiryExportRowDto
            {
                EnquiryId = x.enquiry.EnquiryId,

                CustomerName = x.enquiry.FullName,
                PhoneNumber = x.enquiry.PhoneNumber,
                Email = x.enquiry.Email,

                ProductName = x.product != null
                    ? x.product.ProductName
                    : "General enquiry",

                StatusName = x.status.StatusName,

                Message = x.enquiry.Message,

                CreatedAt = x.enquiry.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<ProductExportRowDto>> GetProductsForExportAsync(AdminProductExportQueryDto query, int maxRows)
    {

        query ??= new AdminProductExportQueryDto();
        maxRows = Math.Clamp(maxRows, 1, 5000);
        var productsQuery =
            from product in _dbContext.Products.AsNoTracking()
            join category in _dbContext.ProductCategories.AsNoTracking()
                on product.ProductCategoryId equals category.ProductCategoryId
            join condition in _dbContext.ProductConditions.AsNoTracking()
                on product.ProductConditionId equals condition.ProductConditionId
            where product.DeletedAt == null
            select new
            {
                product,
                category,
                condition
            };

        if (query.CategoryId.HasValue && query.CategoryId.Value > 0)
        {
            productsQuery = productsQuery.Where(x =>
                x.product.ProductCategoryId == query.CategoryId.Value
            );
        }

        if (query.IsAvailable.HasValue)
        {
            productsQuery = productsQuery.Where(x =>
                x.product.IsAvailable == query.IsAvailable.Value
            );
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();

            productsQuery = productsQuery.Where(x =>
                x.product.ProductName.Contains(search) ||
                (
                    x.product.Brand != null &&
                    x.product.Brand.Contains(search)
                ) ||
                (
                    x.product.ModelName != null &&
                    x.product.ModelName.Contains(search)
                )
            );
        }

        return await productsQuery
            .OrderByDescending(x => x.product.CreatedAt)
            .Take(maxRows)
            .Select(x => new ProductExportRowDto
            {
                ProductId = x.product.ProductId,

                ProductName = x.product.ProductName,
                Brand = x.product.Brand,
                ModelName = x.product.ModelName,

                CategoryName = x.category.CategoryName,
                ConditionName = x.condition.ConditionName,

                Price = x.product.Price,
                StockQuantity = x.product.StockQuantity,

                IsAvailable = x.product.IsAvailable,
                IsFeatured = x.product.IsFeatured,

                CreatedAt = x.product.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<WebsiteVisitExportRowDto>> GetWebsiteVisitsForExportAsync(int maxRows)
    {
        maxRows = Math.Clamp(maxRows, 1, 5000);
        return await _dbContext.WebsiteVisits
            .AsNoTracking()
            .OrderByDescending(visit => visit.CreatedAt)
            .Take(maxRows)
            .Select(visit => new WebsiteVisitExportRowDto
            {
                WebsiteVisitId = visit.WebsiteVisitId,

                VisitorId = visit.VisitorId,
                AppUserId = visit.AppUserId,

                Path = visit.Path,
                Referrer = visit.Referrer,

                IpAddress = visit.IpAddress,
                UserAgent = visit.UserAgent,

                CreatedAt = visit.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<FeedbackExportRowDto>> GetFeedbacksForExportAsync(AdminFeedbackExportQueryDto query, int maxRows)
    {
        query ??= new AdminFeedbackExportQueryDto();
        maxRows = Math.Clamp(maxRows, 1, 5000);

        var feedbackQuery =
            from feedback in _dbContext.CustomerRepairFeedbacks.AsNoTracking()
            join request in _dbContext.ServiceRequests.AsNoTracking()
                on feedback.ServiceRequestId equals request.ServiceRequestId
            where request.DeletedAt == null
            select new
            {
                feedback,
                request
            };

        if (query.IsPublic.HasValue)
        {
            feedbackQuery = feedbackQuery.Where(x =>
                x.feedback.IsPublic == query.IsPublic.Value
            );
        }

        if (query.Rating.HasValue && query.Rating.Value > 0)
        {
            feedbackQuery = feedbackQuery.Where(x =>
                x.feedback.Rating == query.Rating.Value
            );
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();

            feedbackQuery = feedbackQuery.Where(x =>
                x.request.RequestNumber.Contains(search) ||
                x.request.CustomerName.Contains(search) ||
                x.request.PhoneNumber.Contains(search) ||
                (
                    x.feedback.Comment != null &&
                    x.feedback.Comment.Contains(search)
                )
            );
        }

        return await feedbackQuery
            .OrderByDescending(x => x.feedback.CreatedAt)
            .Take(maxRows)
            .Select(x => new FeedbackExportRowDto
            {
                CustomerRepairFeedbackId = x.feedback.CustomerRepairFeedbackId,

                ServiceRequestId = x.feedback.ServiceRequestId,
                RequestNumber = x.request.RequestNumber,

                CustomerId = x.feedback.CustomerId,
                CustomerName = x.request.CustomerName,
                PhoneNumber = x.request.PhoneNumber,

                Rating = x.feedback.Rating,
                Comment = x.feedback.Comment,

                IsPublic = x.feedback.IsPublic,

                CreatedAt = x.feedback.CreatedAt,
                UpdatedAt = x.feedback.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<List<AnnouncementExportRowDto>> GetAnnouncementsForExportAsync(AdminAnnouncementExportQueryDto query, int maxRows)
    {
        query ??= new AdminAnnouncementExportQueryDto();
        maxRows = Math.Clamp(maxRows, 1, 5000);

        var announcementQuery =
            from announcement in _dbContext.Announcements.AsNoTracking()
            join appUser in _dbContext.AppUsers.AsNoTracking()
                on announcement.CreatedByAppUserId equals appUser.AppUserId into appUserJoin
            from appUser in appUserJoin.DefaultIfEmpty()
            where announcement.DeletedAt == null
            select new
            {
                announcement,
                appUser,
                totalViews = announcement.AnnouncementViews.Count
            };

        if (!string.IsNullOrWhiteSpace(query.AnnouncementType))
        {
            var announcementType = query.AnnouncementType.Trim();

            announcementQuery = announcementQuery.Where(x =>
                x.announcement.AnnouncementType == announcementType
            );
        }

        if (!string.IsNullOrWhiteSpace(query.Audience))
        {
            var audience = query.Audience.Trim();

            announcementQuery = announcementQuery.Where(x =>
                x.announcement.Audience == audience
            );
        }

        if (!string.IsNullOrWhiteSpace(query.DisplayLocation))
        {
            var displayLocation = query.DisplayLocation.Trim();

            announcementQuery = announcementQuery.Where(x =>
                x.announcement.DisplayLocation == displayLocation
            );
        }

        if (query.IsActive.HasValue)
        {
            announcementQuery = announcementQuery.Where(x =>
                x.announcement.IsActive == query.IsActive.Value
            );
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();

            announcementQuery = announcementQuery.Where(x =>
                x.announcement.Title.Contains(search) ||
                x.announcement.Message.Contains(search) ||
                (
                    x.announcement.ButtonText != null &&
                    x.announcement.ButtonText.Contains(search)
                ) ||
                (
                    x.appUser != null &&
                    (
                        x.appUser.FullName.Contains(search) ||
                        x.appUser.Email.Contains(search)
                    )
                )
            );
        }

        return await announcementQuery
            .OrderByDescending(x => x.announcement.CreatedAt)
            .Take(maxRows)
            .Select(x => new AnnouncementExportRowDto
            {
                AnnouncementId = x.announcement.AnnouncementId,

                Title = x.announcement.Title,
                Message = x.announcement.Message,

                AnnouncementType = x.announcement.AnnouncementType,
                Audience = x.announcement.Audience,
                DisplayLocation = x.announcement.DisplayLocation,

                ImageUrl = x.announcement.ImageUrl,
                ButtonText = x.announcement.ButtonText,
                ButtonLink = x.announcement.ButtonLink,

                StartAt = x.announcement.StartAt,
                EndAt = x.announcement.EndAt,

                Priority = x.announcement.Priority,

                IsActive = x.announcement.IsActive,
                ShowOnce = x.announcement.ShowOnce,

                CreatedByAppUserId = x.announcement.CreatedByAppUserId,
                CreatedByName = x.appUser != null ? x.appUser.FullName : null,
                CreatedByEmail = x.appUser != null ? x.appUser.Email : null,

                TotalViews = x.totalViews,

                CreatedAt = x.announcement.CreatedAt,
                UpdatedAt = x.announcement.UpdatedAt
            })
            .ToListAsync();
    }
}