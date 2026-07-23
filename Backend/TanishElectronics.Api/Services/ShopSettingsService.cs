using TanishElectronics.Api.DTOs.Admin.Settings;
using TanishElectronics.Api.DTOs.Public;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;
using TanishElectronics.Api.Repositories;

namespace TanishElectronics.Api.Services;

public class ShopSettingsService : IShopSettingsService
{
    private readonly IShopSettingsRepository _settingsRepository;
    private readonly IPublicOutputCacheInvalidator _outputCacheInvalidator;
    private readonly IAuditLogService _auditLogService;
    public ShopSettingsService
    (
        IShopSettingsRepository settingsRepository,
        IPublicOutputCacheInvalidator outputCacheInvalidator,
        IAuditLogService auditLogService
    )
    {
        _settingsRepository = settingsRepository;
        _outputCacheInvalidator = outputCacheInvalidator;
        _auditLogService = auditLogService;
    }

    public async Task<PublicShopSettingsDto> GetPublicSettingsAsync()
    {
        var settings = await GetRequiredSettingsAsync();

        return new PublicShopSettingsDto
        {
            ShopName = settings.ShopName,
            OwnerName = settings.OwnerName,
            PrimaryPhone = settings.PrimaryPhone,
            SecondaryPhone = settings.SecondaryPhone,
            WhatsAppNumber = settings.WhatsAppNumber,
            Email = settings.Email,
            Address = settings.Address,
            City = settings.City,
            Area = settings.Area,
            LocalServiceRadiusKm = settings.LocalServiceRadiusKm,
            HomeVisitMessage = settings.HomeVisitMessage,
            OpeningHours = settings.OpeningHours,
            BookingNotice = settings.BookingNotice
        };
    }
    public async Task<AdminShopSettingsDto> GetAdminSettingsAsync()
    {
        var settings = await GetRequiredSettingsAsync();

        return MapToAdminDto(settings);
    }

    public async Task<AdminShopSettingsDto> UpdateSettingsAsync(UpdateShopSettingsDto dto, int adminAppUserId)
    {
        ValidateSettings(dto);

        var settings = await GetRequiredSettingsAsync();

        settings.ShopName = dto.ShopName.Trim();
        settings.OwnerName = dto.OwnerName.Trim();

        settings.PrimaryPhone = dto.PrimaryPhone.Trim();
        settings.SecondaryPhone = NormalizeOptional(dto.SecondaryPhone)!;
        settings.WhatsAppNumber = dto.WhatsAppNumber.Trim();
        settings.Email = NormalizeOptional(dto.Email);

        settings.Address = dto.Address.Trim();
        settings.City = dto.City.Trim();
        settings.Area = dto.Area.Trim();

        settings.HomeVisitMessage = dto.HomeVisitMessage.Trim();
        settings.OpeningHours = NormalizeOptional(dto.OpeningHours)!;
        settings.BookingNotice = NormalizeOptional(dto.BookingNotice)!;

        settings.LocalServiceRadiusKm = dto.LocalServiceRadiusKm;
        settings.UpdatedAt = DateTime.UtcNow;

        await _settingsRepository.SaveChangesAsync();

        await _outputCacheInvalidator.EvictShopSettingsAsync();

        await _auditLogService.LogAsync(
            adminAppUserId,
            "UpdateShopSettings",
            "ShopBusinessSettings",
            settings.ShopBusinessSettingId,
            "Shop business settings were updated."
        );
        return MapToAdminDto(settings);
    }


    //Private Helper Methods

    private async Task<ShopBusinessSetting> GetRequiredSettingsAsync()
    {
        var settings = await _settingsRepository.GetSettingsAsync();

        if (settings == null)
        {
            throw new KeyNotFoundException("Shop settings were not found.");
        }

        return settings;
    }

    private static AdminShopSettingsDto MapToAdminDto(ShopBusinessSetting settings)
    {
        return new AdminShopSettingsDto
        {
            ShopBusinessSettingId = settings.ShopBusinessSettingId,

            ShopName = settings.ShopName,
            OwnerName = settings.OwnerName,

            PrimaryPhone = settings.PrimaryPhone,
            SecondaryPhone = settings.SecondaryPhone,
            WhatsAppNumber = settings.WhatsAppNumber,
            Email = settings.Email,

            Address = settings.Address,
            City = settings.City,
            Area = settings.Area,

            HomeVisitMessage = settings.HomeVisitMessage,
            OpeningHours = settings.OpeningHours,
            BookingNotice = settings.BookingNotice,

            LocalServiceRadiusKm = settings.LocalServiceRadiusKm,

            UpdatedAt = settings.UpdatedAt,
            CreatedAt = settings.CreatedAt
        };
    }

    private static void ValidateSettings(UpdateShopSettingsDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ShopName))
        {
            throw new InvalidOperationException("Shop name is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.OwnerName))
        {
            throw new InvalidOperationException("Owner name is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.PrimaryPhone))
        {
            throw new InvalidOperationException("Primary phone number is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.WhatsAppNumber))
        {
            throw new InvalidOperationException("WhatsApp number is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Address))
        {
            throw new InvalidOperationException("Address is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.City))
        {
            throw new InvalidOperationException("City is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Area))
        {
            throw new InvalidOperationException("Area is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.HomeVisitMessage))
        {
            throw new InvalidOperationException("Home visit message is required.");
        }

        if (dto.LocalServiceRadiusKm <= 0 || dto.LocalServiceRadiusKm > 100)
        {
            throw new InvalidOperationException(
                "Local service radius must be between 1 and 100 km."
            );
        }
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}