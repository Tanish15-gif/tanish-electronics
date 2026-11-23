using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.Exceptions;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services.Security;

public sealed class RepairAccessService(TanishElectronicsDbContext db, ICurrentUserService currentUser,
    IDataProtectionProvider protection)
{
    private readonly ITimeLimitedDataProtector _uploads = protection.CreateProtector("RepairUploads.v1").ToTimeLimitedDataProtector();
    private readonly ITimeLimitedDataProtector _tracking = protection.CreateProtector("RepairTracking.v1").ToTimeLimitedDataProtector();
    private readonly ITimeLimitedDataProtector _images = protection.CreateProtector("RepairImageRead.v1").ToTimeLimitedDataProtector();

    public string IssueUploadToken(int repairId) => _uploads.Protect(repairId.ToString(), TimeSpan.FromMinutes(20));
    public string IssueTrackingToken(string requestNumber) => _tracking.Protect(requestNumber.Trim().ToUpperInvariant(), TimeSpan.FromMinutes(10));
    public bool HasUploadToken(int repairId, string? token) => Validate(_uploads, repairId.ToString(), token);
    public bool HasTrackingToken(string requestNumber, string? token) => Validate(_tracking, requestNumber.Trim().ToUpperInvariant(), token);
    public DateTime? TrackingExpiry(string requestNumber, string? token)
    {
        if (string.IsNullOrWhiteSpace(token) || token.Length > 2048) return null;
        try
        {
            var payload = _tracking.Unprotect(token, out DateTimeOffset expiresAt);
            return payload == requestNumber.Trim().ToUpperInvariant() ? expiresAt.UtcDateTime : null;
        }
        catch (System.Security.Cryptography.CryptographicException) { return null; }
    }
    public string SignImageUrl(int repairId, string url) => url + "?token=" + Uri.EscapeDataString(
        _images.Protect(repairId + "/" + url.Split('/').Last(), TimeSpan.FromMinutes(10)));
    public bool HasImageToken(int repairId, string fileName, string? token) => Validate(_images, repairId + "/" + fileName, token);

    private static bool Validate(ITimeLimitedDataProtector protector, string expected, string? token)
    {
        if (string.IsNullOrWhiteSpace(token) || token.Length > 2048) return false;
        try { return protector.Unprotect(token) == expected; }
        catch (System.Security.Cryptography.CryptographicException) { return false; }
    }

    public async Task<bool> CanAccessAsync(int repairId)
    {
        var userId = await currentUser.GetCurrentAppUserIdAsync();
        if (userId == null) return false;
        var isAdmin = await db.AppUserRoles.AnyAsync(r => r.AppUserId == userId &&
            r.AppUser.IsActive && r.AppUser.DeletedAt == null &&
            (r.Role.RoleName == RoleNames.Admin || r.Role.RoleName == RoleNames.Owner));
        return await db.ServiceRequests.AnyAsync(r => r.ServiceRequestId == repairId && r.DeletedAt == null &&
            (isAdmin || (r.Customer != null && r.Customer.AppUserId == userId &&
                r.Customer.IsActive && r.Customer.DeletedAt == null && r.Customer.AppUser!.IsActive &&
                r.Customer.AppUser.DeletedAt == null)));
    }

    public async Task RequireAsync(int repairId, string? uploadToken = null)
    {
        if (!HasUploadToken(repairId, uploadToken) && !await CanAccessAsync(repairId))
            throw new ForbiddenAccessException("You do not have access to this repair.");
    }
}
