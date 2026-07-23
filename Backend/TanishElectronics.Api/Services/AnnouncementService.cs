using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.Delegates;
using TanishElectronics.Api.DTOs.Admin.Announcements;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.DTOs.Public.Announcements;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;
using TanishElectronics.Api.Settings;

namespace TanishElectronics.Api.Services;

public class AnnouncementService : IAnnouncementService
{
    private const string PublicAnnouncementsCachePrefix = "public-announcements";
    private readonly IAnnouncementRepository _repository;
    private readonly AnnouncementAudienceMatcher _audienceMatcher;
    private readonly IAnnouncementRealtimeNotifier _realtimeNotifier;
    private readonly IAppMemoryCacheService _memoryCache;
    private readonly ShopSettings _shopSettings;
    private readonly ILogger<AnnouncementService> _logger;
    private readonly IPublicOutputCacheInvalidator _outputCacheInvalidator;
    public AnnouncementService
    (
        IAnnouncementRepository repository,
        AnnouncementAudienceMatcher audienceMatcher,
        IAnnouncementRealtimeNotifier realtimeNotifier,
        IAppMemoryCacheService memoryCache,
        IOptions<ShopSettings> shopSettings,
        ILogger<AnnouncementService> logger,
        IPublicOutputCacheInvalidator outputCacheInvalidator
    )
    {
        _repository = repository;
        _audienceMatcher = audienceMatcher;
        _realtimeNotifier = realtimeNotifier;
        _memoryCache = memoryCache;
        _shopSettings = shopSettings.Value;
        _logger = logger;
        _outputCacheInvalidator = outputCacheInvalidator;
    }
    public async Task<AdminAnnouncementDto> CreateAnnouncementAsync(CreateAnnouncementDto dto, int? createdByAppUserId)
    {
        _logger.LogInformation(
            "Creating announcement. Type: {AnnouncementType}, Location: {DisplayLocation}, Audience: {Audience}",
            dto.AnnouncementType,
            dto.DisplayLocation,
            dto.Audience
        );
        ValidateCreateOrUpdate(dto.Title, dto.Message, dto.AnnouncementType, dto.Audience, dto.DisplayLocation,
        dto.Priority, dto.StartAt, dto.EndAt);

        var createAnnouncement = await _repository.CreateAnnouncementAsync(dto, createdByAppUserId);

        _memoryCache.RemoveByPrefix(PublicAnnouncementsCachePrefix);


        await _outputCacheInvalidator.EvictAnnouncementsAsync();

        _logger.LogInformation(
            "Announcement created. AnnouncementId: {AnnouncementId}, Title: {Title}",
            createAnnouncement.AnnouncementId,
            createAnnouncement.Title
        );

        await _realtimeNotifier.NotifyAnnouncementsChangedAsync(createAnnouncement.DisplayLocation);

        _logger.LogInformation(
            "Announcement realtime notification sent. AnnouncementId: {AnnouncementId}, Location: {Location}",
            createAnnouncement.AnnouncementId,
            createAnnouncement.DisplayLocation
        );

        return createAnnouncement;
    }

    public async Task<PagedResultDto<AdminAnnouncementDto>> GetAdminAnnouncementsAsync(AdminAnnouncementQueryDto query)
    {
        return await _repository.GetAdminAnnouncementsAsync(query);
    }

    public async Task<List<PublicAnnouncementDto>> GetPublicAnnouncementAsync(string location, string audience, int limit)
    {
        if (string.IsNullOrWhiteSpace(location))
        {
            location = "Homepage";
        }

        if (string.IsNullOrWhiteSpace(audience))
        {
            audience = "UnsignedVisitors";
        }

        location = NormalizeAllowedValue(
            location,
            AnnouncementConstants.AllowedLocations,
            "Invalid announcement location.");

        audience = NormalizeAllowedValue(
            audience,
            AnnouncementConstants.AllowedAudiences,
            "Invalid announcement audience.");

        if (limit <= 0)
        {
            limit = _shopSettings.DefaultPublicAnnouncementLimit;
        }

        if (limit > _shopSettings.MaxPublicAnnouncementLimit)
        {
            limit = _shopSettings.MaxPublicAnnouncementLimit;
        }

        var cacheKey = $"{PublicAnnouncementsCachePrefix}:{location}:{audience}:{limit}";

        var announcements = await _repository.GetActivePublicAnnouncementsAsync(location);
        return await _memoryCache.GetOrCreateAsync(
            cacheKey,
            async () =>
            {
                var announcement = await _repository.GetActivePublicAnnouncementsAsync(location);

                return announcements
                    .Where(announcement => _audienceMatcher(announcement.Audience, audience)
                ).Take(limit).ToList();
            },
            TimeSpan.FromMinutes(2)
        );
    }

    public async Task<bool> SoftDeleteAnnouncementAsync(int id)
    {
        _logger.LogInformation(
            "Deleting announcement. AnnouncementId: {AnnouncementId}",
            id
        );
        var deleted = await _repository.SoftDeleteAnnouncementAsync(id);

        if (!deleted)
        {
            _logger.LogWarning(
                "Announcement delete failed because announcement was not found. AnnouncementId: {AnnouncementId}",
                id
            );
            return false;
        }
        _memoryCache.RemoveByPrefix(PublicAnnouncementsCachePrefix);
        await _outputCacheInvalidator.EvictAnnouncementsAsync();
        await _realtimeNotifier.NotifyAnnouncementsChangedAsync("All");

        _logger.LogInformation(
            "Announcement deleted. AnnouncementId: {AnnouncementId}",
            id
        );
        return deleted;
    }

    public async Task<bool> UpdateAnnouncementAsync(int id, UpdateAnnouncementDto dto)
    {
        _logger.LogInformation(
            "Updating announcement. AnnouncementId: {AnnouncementId}",
            id
        );
        ValidateCreateOrUpdate(dto.Title, dto.Message, dto.AnnouncementType, dto.Audience,
        dto.DisplayLocation, dto.Priority, dto.StartAt, dto.EndAt);

        var updated = await _repository.UpdateAnnouncementAsync(id, dto);

        if (!updated)
        {
            _logger.LogInformation(
                "Announcement update failed because announcement was not found. AnnouncementId: {AnnouncementId}",
                id
            );
            return false;
        }
        _memoryCache.RemoveByPrefix(PublicAnnouncementsCachePrefix);
        await _outputCacheInvalidator.EvictAnnouncementsAsync();
        await _realtimeNotifier.NotifyAnnouncementsChangedAsync(dto.DisplayLocation);

        _logger.LogInformation(
            "Announcement updated. AnnouncementId: {AnnouncementId}, Location: {Location}",
            id,
            dto.DisplayLocation
        );
        return true;
    }
    private static void ValidateCreateOrUpdate(
        string title,
        string message,
        string announcementType,
        string audience,
        string displayLocation,
        int priority,
        DateTime? startAt,
        DateTime? endAt
    )
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new InvalidOperationException("Announcement title is required.");
        }

        if (title.Trim().Length > 150)
        {
            throw new InvalidOperationException("Announcement title cannot be more than 150 characters.");
        }

        if (string.IsNullOrWhiteSpace(message))
        {
            throw new InvalidOperationException("Announcement message is required.");
        }

        if (message.Trim().Length > 1000)
        {
            throw new InvalidOperationException("Announcement message cannot be more than 1000 characters.");
        }

        if (!AnnouncementConstants.AllowedTypes.Contains(announcementType, StringComparer.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invalid announcement type.");
        }

        if (!AnnouncementConstants.AllowedAudiences.Contains(audience, StringComparer.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invalid announcement audience.");
        }

        if (!AnnouncementConstants.AllowedLocations.Contains(displayLocation, StringComparer.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invalid display location.");
        }

        if (priority < 1 || priority > 4)
        {
            throw new InvalidOperationException("Priority must be between 1 and 4.");
        }

        if (startAt != null && endAt != null && endAt <= startAt)
        {
            throw new InvalidOperationException("End date must be after start date.");
        }
    }

    public async Task<int> ExpireAnnouncementsAsync()
    {
        var expiredCount = await _repository.DeactivateExpiredAnnouncementsAsync(DateTime.Now);

        if (expiredCount > 0)
        {
            await _realtimeNotifier.NotifyAnnouncementsChangedAsync("All");
        }
        return expiredCount;
    }
    public async Task<List<PublicAnnouncementDto>> GetCustomerAnnouncementsAsync(string location, int limit)
    {
        if (string.IsNullOrWhiteSpace(location))
        {
            location = "CustomerDashboard";
        }

        location = NormalizeAllowedValue(
            location,
            AnnouncementConstants.AllowedLocations,
            "Invalid announcement location."
        );

        if (limit <= 0)
        {
            limit = AnnouncementConstants.DefaultPublicLimit;
        }

        if (limit > AnnouncementConstants.MaxPublicLimit)
        {
            limit = AnnouncementConstants.MaxPublicLimit;
        }

        return await _repository.GetActiveCustomerAnnouncementsAsync(location, limit);
    }

    public async Task<bool> MarkAnnouncementAsViewedAsync(int announcementId, int appUserId)
    {
        return await _repository.MarkAnnouncementAsViewedAsync(
            announcementId,
            appUserId
        );
    }
    private static string NormalizeAllowedValue(string value, string[] allowedValues, string errorMessage)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException(errorMessage);
        }

        var matchedValue = allowedValues.FirstOrDefault(allowedValue =>
            allowedValue.Equals(value.Trim(), StringComparison.OrdinalIgnoreCase)
        );

        if (matchedValue == null)
        {
            throw new InvalidOperationException(errorMessage);
        }

        return matchedValue;
    }

    public async Task<PublicAnnouncementDto?> GetCustomerPopupAnnouncementAsync(string location, int appUserId)
    {
        if (string.IsNullOrWhiteSpace(location))
        {
            location = "CustomerDashboard";
        }

        location = NormalizeAllowedValue(
            location,
            AnnouncementConstants.AllowedLocations,
            "Invalid announcement location."
        );

        if (appUserId <= 0)
        {
            throw new InvalidOperationException("Invalid customer account");
        }

        return await _repository.GetUnviewedCustomerPopupAnnouncementAsync(location, appUserId);
    }

    public async Task<string> UpdateAnnouncementImageAsync(int announcementId, IFormFile image)
    {
        _logger.LogInformation(
            "Uploading announcement image. AnnouncementId: {AnnouncementId}, FileName: {FileName}, Size: {Size}, ContentType: {ContentType}",
            announcementId,
            image.FileName,
            image.Length,
            image.ContentType
        );

        if (image == null || image.Length == 0)
        {
            _logger.LogWarning(
                "Announcement image upload rejected because file was empty. AnnouncementId: {AnnouncementId}",
                announcementId
            );
            throw new InvalidOperationException("Please upload a valid image.");
        }

        var allowedContentTypes = new[]
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };

        if (!allowedContentTypes.Contains(image.ContentType.ToLower()))
        {
            _logger.LogWarning(
                "Announcement image upload rejected because content type is invalid. AnnouncementId: {AnnouncementId}, ContentType: {ContentType}",
                announcementId,
                image.ContentType
            );
            throw new InvalidOperationException("Only JPG, PNG and WEBP images are allowed.");
        }

        var allowedExtensions = new[]
        {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
        };

        var extension = Path.GetExtension(image.FileName).ToLower();

        if (!allowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException("Only JPG, PNG and WEBP images are allowed.");
        }

        var maxImageSizeBytes = _shopSettings.MaxUploadImageSizeMb * 1024 * 1024;

        if (image.Length > maxImageSizeBytes)
        {
            throw new InvalidOperationException("Image must be less than 5MB.");
        }

        var uploadFolder = Path.Combine(
            Directory.GetCurrentDirectory(),
            "wwwroot",
            "uploads",
            "announcements"
        );

        if (!Directory.Exists(uploadFolder))
        {
            Directory.CreateDirectory(uploadFolder);
        }

        var fileName = $"announcement-{announcementId}-{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadFolder, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await image.CopyToAsync(stream);
        }

        var imageUrl = $"/uploads/announcements/{fileName}";

        var saved = await _repository.UpdateAnnouncementImageAsync(
            announcementId,
            imageUrl
        );

        if (!saved)
        {
            throw new InvalidOperationException("Announcement not found.");
        }

        _memoryCache.RemoveByPrefix(PublicAnnouncementsCachePrefix);

        await _outputCacheInvalidator.EvictAnnouncementsAsync();

        await _realtimeNotifier.NotifyAnnouncementsChangedAsync("All");

        return imageUrl;
    }
}