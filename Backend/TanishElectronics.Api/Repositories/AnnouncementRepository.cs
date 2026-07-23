using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Admin.Announcements;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.DTOs.Public.Announcements;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;

namespace TanishElectronics.Api.Repositories;

public class AnnouncementRepository : IAnnouncementRepository
{
    private readonly TanishElectronicsDbContext _dbContext;
    public AnnouncementRepository(TanishElectronicsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResultDto<AdminAnnouncementDto>> GetAdminAnnouncementsAsync(AdminAnnouncementQueryDto query)
    {
        query ??= new AdminAnnouncementQueryDto();

        query.PageNumber = Math.Max(query.PageNumber, 1);
        query.PageSize = Math.Clamp(query.PageSize, 1, 50);

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

        var totalRecords = await announcementQuery.CountAsync();

        var totalPages = (int)Math.Ceiling(
            totalRecords / (double)query.PageSize
        );
        var items = await announcementQuery
            .OrderByDescending(x => x.announcement.CreatedAt)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(x => new AdminAnnouncementDto
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
                CreatedAt = x.announcement.CreatedAt,
                UpdatedAt = x.announcement.UpdatedAt
            })
            .ToListAsync();
        return new PagedResultDto<AdminAnnouncementDto>
        {
            Items = items,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            TotalRecords = totalRecords,
            TotalPages = Math.Max(totalPages, 1)
        };
    }
    public async Task<AdminAnnouncementDto> CreateAnnouncementAsync(CreateAnnouncementDto dto, int? createdByAppUserId)
    {
        var announcement = new Announcement
        {
            Title = dto.Title.Trim(),
            Message = dto.Message.Trim(),

            AnnouncementType = dto.AnnouncementType.Trim(),
            Audience = dto.Audience.Trim(),
            DisplayLocation = dto.DisplayLocation.Trim(),

            ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl)
                ? null
                : dto.ImageUrl.Trim(),

            ButtonText = string.IsNullOrWhiteSpace(dto.ButtonText)
                ? null
                : dto.ButtonText.Trim(),

            ButtonLink = string.IsNullOrWhiteSpace(dto.ButtonLink)
                ? null
                : dto.ButtonLink.Trim(),

            StartAt = dto.StartAt,
            EndAt = dto.EndAt,

            Priority = dto.Priority,
            IsActive = dto.IsActive,
            ShowOnce = dto.ShowOnce,

            CreatedByAppUserId = createdByAppUserId,
            CreatedAt = DateTime.Now
        };

        await _dbContext.Announcements.AddAsync(announcement);
        await _dbContext.SaveChangesAsync();

        return MapToAdminDto(announcement);
    }

    public async Task<List<PublicAnnouncementDto>> GetActivePublicAnnouncementsAsync(string location)
    {
        var now = DateTime.Now;

        return await _dbContext.Announcements
            .Where(announcement =>
                announcement.DeletedAt == null &&
                announcement.IsActive &&
                (
                    announcement.DisplayLocation == location ||
                    announcement.DisplayLocation == "AllPublicPages"
                ) &&
                (
                    announcement.StartAt == null ||
                    announcement.StartAt <= now
                ) &&
                (
                    announcement.EndAt == null ||
                    announcement.EndAt >= now
                )
            )
            .OrderByDescending(announcement => announcement.Priority)
            .ThenByDescending(announcement => announcement.CreatedAt)
            .Select(announcement => new PublicAnnouncementDto
            {
                AnnouncementId = announcement.AnnouncementId,
                Title = announcement.Title,
                Message = announcement.Message,
                AnnouncementType = announcement.AnnouncementType,
                DisplayLocation = announcement.DisplayLocation,
                Audience = announcement.Audience,
                ImageUrl = announcement.ImageUrl,
                ButtonText = announcement.ButtonText,
                ButtonLink = announcement.ButtonLink,
                Priority = announcement.Priority,
                ShowOnce = announcement.ShowOnce,
                EndAt = announcement.EndAt
            })
            .ToListAsync();
    }

    public async Task<bool> SoftDeleteAnnouncementAsync(int id)
    {
        var announcement = await _dbContext.Announcements
            .FirstOrDefaultAsync(announcement =>
                announcement.AnnouncementId == id &&
                announcement.DeletedAt == null
            );

        if (announcement == null)
        {
            return false;
        }

        announcement.DeletedAt = DateTime.Now;
        announcement.IsActive = false;

        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateAnnouncementAsync(int id, UpdateAnnouncementDto dto)
    {
        var announcement = await _dbContext.Announcements
            .FirstOrDefaultAsync(announcement =>
                announcement.AnnouncementId == id &&
                announcement.DeletedAt == null
            );

        if (announcement == null)
        {
            return false;
        }

        announcement.Title = dto.Title.Trim();
        announcement.Message = dto.Message.Trim();

        announcement.AnnouncementType = dto.AnnouncementType.Trim();
        announcement.Audience = dto.Audience.Trim();
        announcement.DisplayLocation = dto.DisplayLocation.Trim();

        announcement.ImageUrl = string.IsNullOrWhiteSpace(dto.ImageUrl)
            ? null
            : dto.ImageUrl.Trim();

        announcement.ButtonText = string.IsNullOrWhiteSpace(dto.ButtonText)
            ? null
            : dto.ButtonText.Trim();

        announcement.ButtonLink = string.IsNullOrWhiteSpace(dto.ButtonLink)
            ? null
            : dto.ButtonLink.Trim();

        announcement.StartAt = dto.StartAt;
        announcement.EndAt = dto.EndAt;

        announcement.Priority = dto.Priority;
        announcement.IsActive = dto.IsActive;
        announcement.ShowOnce = dto.ShowOnce;

        announcement.UpdatedAt = DateTime.Now;

        await _dbContext.SaveChangesAsync();
        return true;
    }
    private static AdminAnnouncementDto MapToAdminDto(Announcement announcement)
    {
        return new AdminAnnouncementDto
        {
            AnnouncementId = announcement.AnnouncementId,
            Title = announcement.Title,
            Message = announcement.Message,
            AnnouncementType = announcement.AnnouncementType,
            Audience = announcement.Audience,
            DisplayLocation = announcement.DisplayLocation,
            ImageUrl = announcement.ImageUrl,
            ButtonText = announcement.ButtonText,
            ButtonLink = announcement.ButtonLink,
            StartAt = announcement.StartAt,
            EndAt = announcement.EndAt,
            Priority = announcement.Priority,
            IsActive = announcement.IsActive,
            ShowOnce = announcement.ShowOnce,
            CreatedAt = announcement.CreatedAt,
            UpdatedAt = announcement.UpdatedAt
        };
    }

    public async Task<int> DeactivateExpiredAnnouncementsAsync(DateTime now)
    {
        var expiredAnnouncements = await _dbContext.Announcements
            .Where(announcement =>
                announcement.DeletedAt == null &&
                announcement.IsActive &&
                announcement.EndAt != null &&
                announcement.EndAt <= now
            ).ToListAsync();

        if (expiredAnnouncements.Count == 0) return 0;

        foreach (var item in expiredAnnouncements)
        {
            item.IsActive = false;
            item.UpdatedAt = now;
        }
        await _dbContext.SaveChangesAsync();
        return expiredAnnouncements.Count;
    }

    public async Task<List<PublicAnnouncementDto>> GetActiveCustomerAnnouncementsAsync(string location, int limit)
    {
        var now = DateTime.Now;

        return await _dbContext.Announcements
            .AsNoTracking()
            .Where(announcement =>
                announcement.DeletedAt == null &&
                announcement.IsActive &&

                (
                    announcement.DisplayLocation == location ||
                    announcement.DisplayLocation == "AllPublicPages"
                ) &&

                (
                    announcement.Audience == "All" ||
                    announcement.Audience == "SignedCustomers"
                ) &&

                (announcement.StartAt == null || announcement.StartAt <= now) &&
                (announcement.EndAt == null || announcement.EndAt >= now)
            )
            .OrderByDescending(announcement => announcement.Priority)
            .ThenByDescending(announcement => announcement.CreatedAt)
            .Take(limit)
            .Select(announcement => new PublicAnnouncementDto
            {
                AnnouncementId = announcement.AnnouncementId,
                Title = announcement.Title,
                Message = announcement.Message,
                AnnouncementType = announcement.AnnouncementType,
                Audience = announcement.Audience,
                DisplayLocation = announcement.DisplayLocation,
                ImageUrl = announcement.ImageUrl,
                ButtonText = announcement.ButtonText,
                ButtonLink = announcement.ButtonLink,
                Priority = announcement.Priority,
                ShowOnce = announcement.ShowOnce,
                EndAt = announcement.EndAt
            })
            .ToListAsync();
    }
    public async Task<bool> MarkAnnouncementAsViewedAsync(int announcementId, int appUserId)
    {
        var announcementExists = await _dbContext.Announcements
            .AnyAsync(announcement =>
                announcement.AnnouncementId == announcementId &&
                announcement.DeletedAt == null);

        if (!announcementExists) return false;

        var alreadyViewed = await _dbContext.AnnouncementViews
            .AnyAsync(view =>
                view.AnnouncementId == announcementId &&
                view.AppUserId == appUserId);

        if (alreadyViewed) return true;

        var viewRecord = new AnnouncementView
        {
            AnnouncementId = announcementId,
            AppUserId = appUserId,
            ViewedAt = DateTime.Now
        };
        await _dbContext.AnnouncementViews.AddAsync(viewRecord);
        await _dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<PublicAnnouncementDto?> GetUnviewedCustomerPopupAnnouncementAsync(string location, int appUserId)
    {
        var now = DateTime.Now;

        return await _dbContext.Announcements
            .AsNoTracking()
            .Where(announcement =>
                announcement.DeletedAt == null &&
                announcement.IsActive &&

                announcement.ShowOnce &&

                (
                    announcement.DisplayLocation == location ||
                    announcement.DisplayLocation == "AllPublicPages"
                ) &&

                (
                    announcement.Audience == "All" ||
                    announcement.Audience == "SignedCustomers"
                ) &&

                (announcement.StartAt == null || announcement.StartAt <= now) &&
                (announcement.EndAt == null || announcement.EndAt >= now) &&

                !_dbContext.AnnouncementViews.Any(view =>
                    view.AnnouncementId == announcement.AnnouncementId &&
                    view.AppUserId == appUserId
                )
            )
            .OrderByDescending(announcement => announcement.Priority)
            .ThenByDescending(announcement => announcement.CreatedAt)
            .Select(announcement => new PublicAnnouncementDto
            {
                AnnouncementId = announcement.AnnouncementId,
                Title = announcement.Title,
                Message = announcement.Message,
                AnnouncementType = announcement.AnnouncementType,
                Audience = announcement.Audience,
                DisplayLocation = announcement.DisplayLocation,
                ImageUrl = announcement.ImageUrl,
                ButtonText = announcement.ButtonText,
                ButtonLink = announcement.ButtonLink,
                Priority = announcement.Priority,
                ShowOnce = announcement.ShowOnce,
                EndAt = announcement.EndAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<bool> UpdateAnnouncementImageAsync(int announcementId, string imageUrl)
    {
        var announcement = await _dbContext.Announcements
            .FirstOrDefaultAsync(announcement =>
                announcement.AnnouncementId == announcementId &&
                announcement.DeletedAt == null);

        if (announcement == null) return false;

        announcement.ImageUrl = imageUrl;
        announcement.UpdatedAt = DateTime.Now;

        await _dbContext.SaveChangesAsync();

        return true;
    }
}