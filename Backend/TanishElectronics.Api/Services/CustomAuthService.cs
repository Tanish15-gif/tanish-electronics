using Microsoft.Extensions.Options;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Auth.Custom;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Enums.Auth;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;
using TanishElectronics.Api.Settings;

namespace TanishElectronics.Api.Services;

public class CustomAuthService : ICustomAuthService
{
    private readonly ICustomAuthRepository _authRepository;
    private readonly IPasswordHasherService _hasherService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly JwtSettings _jwtSettings;
    public CustomAuthService
    (
        ICustomAuthRepository authRepository,
        IPasswordHasherService hasherService,
        IJwtTokenService jwtTokenService,
        IHttpContextAccessor httpContextAccessor,
        IOptions<JwtSettings> jwtOptions
    )
    {
        _authRepository = authRepository;
        _hasherService = hasherService;
        _jwtTokenService = jwtTokenService;
        _httpContextAccessor = httpContextAccessor;
        _jwtSettings = jwtOptions.Value;
    }

    #region  Register & Login Service
    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto)
    {
        ValidateRegisterRequest(dto);

        var normalizedEmail = NormalizeEmail(dto.Email);

        var emailExists = await _authRepository.EmailExistsAsync(normalizedEmail);

        if (emailExists)
        {
            await LogAuthEventAsync(
                null,
                dto.Email,
                AuthEventType.RegisterFailed,
                false,
                AuthFailureReason.EmailAlreadyExists.ToString()
            );

            throw new InvalidOperationException("Email already exists.");
        }
        var user = new AppUser
        {
            ClerkUserId = null,
            FullName = dto.FullName.Trim(),
            Email = dto.Email.Trim(),
            NormalizedEmail = normalizedEmail,
            PhoneNumber = string.IsNullOrWhiteSpace(dto.PhoneNumber)
                ? null
                : dto.PhoneNumber.Trim(),
            PasswordHash = _hasherService.HashPassword(dto.Password),
            EmailConfirmed = false,
            IsActive = true,
            AccessFailedCount = 0,
            CreatedAt = DateTime.UtcNow,
            PasswordUpdatedAt = DateTime.UtcNow
        };

        await _authRepository.CreateUserAsync(user);

        await _authRepository.AssignRoleAsync(user.AppUserId, RoleNames.Customer);

        var roles = await _authRepository.GetUserRolesAsync(user.AppUserId);

        var refreshToken = _jwtTokenService.GenerateRefreshToken();

        await SaveRefreshTokenAsync(user.AppUserId, refreshToken);

        await LogAuthEventAsync(
            user.AppUserId,
            user.Email,
            AuthEventType.RegisterSucceeded,
            true,
            "User registered successfully."
        );

        return _jwtTokenService.GenerateAuthResponse(user, roles, refreshToken);
    }
    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto)
    {
        ValidateLoginRequest(dto);

        var normalizedEmail = NormalizeEmail(dto.Email);

        var user = await _authRepository.GetUserByNormalizedEmailAsync(normalizedEmail);

        if (user == null)
        {
            await LogAuthEventAsync(
                null,
                dto.Email,
                AuthEventType.LoginFailed,
                false,
                AuthFailureReason.UserNotFound.ToString()
            );
            throw new UnauthorizedAccessException("Invalid email and password");
        }
        if (!user.IsActive || user.DeletedAt != null)
        {
            await LogAuthEventAsync(
                user.AppUserId,
                user.Email,
                AuthEventType.LoginFailed,
                false,
                AuthFailureReason.AccountInactive.ToString()
            );

            throw new UnauthorizedAccessException("Invalid email or password.");
        }
        if (user.LockoutEndAt != null && user.LockoutEndAt > DateTime.UtcNow)
        {
            await LogAuthEventAsync(
                user.AppUserId,
                user.Email,
                AuthEventType.LoginFailed,
                false,
                AuthFailureReason.AccountLocked.ToString()
            );

            throw new UnauthorizedAccessException("Account is temporarily locked.");
        }

        var isPasswordValid = _hasherService.VerifyPassword(dto.Password, user.PasswordHash ?? "");

        if (!isPasswordValid)
        {
            user.AccessFailedCount += 1;
            if (user.AccessFailedCount >= 5)
            {
                user.LockoutEndAt = DateTime.UtcNow.AddMinutes(15);
                await LogAuthEventAsync(
                    user.AppUserId,
                    user.Email,
                    AuthEventType.AccountLocked,
                    false,
                    "Account locked after too many failed login attempts."
                );
            }
            await _authRepository.UpdateUserAsync(user);

            await LogAuthEventAsync(
                user.AppUserId,
                user.Email,
                AuthEventType.LoginFailed,
                false,
                AuthFailureReason.InvalidPassword.ToString()
            );

            throw new UnauthorizedAccessException("Invalid email or password");
        }
        user.AccessFailedCount = 0;
        user.LockoutEndAt = null;
        user.LastLoginAt = DateTime.UtcNow;
        user.LastSeenAt = DateTime.UtcNow;

        await _authRepository.UpdateUserAsync(user);

        var roles = await _authRepository.GetUserRolesAsync(user.AppUserId);

        var refreshToken = _jwtTokenService.GenerateRefreshToken();

        await SaveRefreshTokenAsync(user.AppUserId, refreshToken);

        await LogAuthEventAsync(
            user.AppUserId,
            user.Email,
            AuthEventType.LoginSucceeded,
            true,
            "User logged in successfully"
        );

        return _jwtTokenService.GenerateAuthResponse(user, roles, refreshToken);
    }

    #endregion 

    #region Refresh Token
    public async Task<AuthResponseDto> RefreshAsync(RefreshTokenRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RefreshToken))
        {
            throw new UnauthorizedAccessException("Invalid refresh token.");
        }

        var oldTokenHash = _jwtTokenService.HashRefreshToken(dto.RefreshToken);

        var storedToken = await _authRepository.GetRefreshTokenByHashAsync(
            oldTokenHash
        );

        if (storedToken == null)
        {
            await LogAuthEventAsync(
                null,
                null,
                AuthEventType.RefreshTokenFailed,
                false,
                AuthFailureReason.InvalidRefreshToken.ToString()
            );

            throw new UnauthorizedAccessException("Invalid refresh token.");
        }

        if (storedToken.RevokedAt != null)
        {
            await LogAuthEventAsync(
                storedToken.AppUserId,
                storedToken.AppUser.Email,
                AuthEventType.RefreshTokenFailed,
                false,
                AuthFailureReason.RevokedRefreshToken.ToString()
            );

            throw new UnauthorizedAccessException("Invalid refresh token.");
        }

        if (storedToken.ExpiresAt <= DateTime.UtcNow)
        {
            await LogAuthEventAsync(
                storedToken.AppUserId,
                storedToken.AppUser.Email,
                AuthEventType.RefreshTokenFailed,
                false,
                AuthFailureReason.ExpiredRefreshToken.ToString()
            );

            throw new UnauthorizedAccessException("Refresh token expired.");
        }

        var user = storedToken.AppUser;

        if (!user.IsActive || user.DeletedAt != null)
        {
            throw new UnauthorizedAccessException("Invalid refresh token.");
        }

        var newRefreshToken = _jwtTokenService.GenerateRefreshToken();
        var newRefreshTokenHash = _jwtTokenService.HashRefreshToken(newRefreshToken);

        await _authRepository.RevokeRefreshTokenAsync(
            storedToken,
            GetClientIpAddress(),
            newRefreshTokenHash
        );

        await SaveRefreshTokenAsync(user.AppUserId, newRefreshToken);

        user.LastSeenAt = DateTime.UtcNow;

        await _authRepository.UpdateUserAsync(user);

        var roles = user.AppUserRoles
            .Select(userRole => userRole.Role.RoleName)
            .ToList();

        await LogAuthEventAsync(
            user.AppUserId,
            user.Email,
            AuthEventType.RefreshTokenSucceeded,
            true,
            "Refresh token rotated successfully."
        );

        return _jwtTokenService.GenerateAuthResponse(
            user,
            roles,
            newRefreshToken
        );
    }

    public async Task LogoutAsync(LogoutRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RefreshToken))
        {
            return;
        }

        var tokenHash = _jwtTokenService.HashRefreshToken(dto.RefreshToken);

        var storedToken = await _authRepository.GetRefreshTokenByHashAsync(
            tokenHash
        );

        if (storedToken == null || storedToken.RevokedAt != null)
        {
            return;
        }

        await _authRepository.RevokeRefreshTokenAsync(
            storedToken,
            GetClientIpAddress()
        );

        var user = storedToken.AppUser;
        user.LastLogoutAt = DateTime.UtcNow;

        await _authRepository.UpdateUserAsync(user);

        await LogAuthEventAsync(
            user.AppUserId,
            user.Email,
            AuthEventType.LogoutSucceeded,
            true,
            "User logged out successfully."
        );
    }
    #endregion 

    private async Task SaveRefreshTokenAsync(int appUserId, string refreshToken)
    {
        var tokenHash = _jwtTokenService.HashRefreshToken(refreshToken);

        var refreshTokenEntity = new RefreshToken
        {
            AppUserId = appUserId,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenDays),
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = GetClientIpAddress(),
            UserAgent = GetUserAgent()
        };

        await _authRepository.AddRefreshTokenAsync(refreshTokenEntity);
    }

    private async Task LogAuthEventAsync(
        int? appUserId,
        string? email,
        AuthEventType eventType,
        bool success,
        string? description
    )
    {
        var authEvent = new UserAuthEvent
        {
            AppUserId = appUserId,
            Email = email,
            EventType = eventType.ToString(),
            Success = success,
            IpAddress = GetClientIpAddress(),
            UserAgent = GetUserAgent(),
            Description = description,
            CreatedAt = DateTime.UtcNow
        };

        await _authRepository.AddAuthEventAsync(authEvent);
    }

    private static void ValidateRegisterRequest(RegisterRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName))
        {
            throw new InvalidOperationException("Full name is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            throw new InvalidOperationException("Email is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Password))
        {
            throw new InvalidOperationException("Password is required.");
        }

        if (dto.Password.Length < 8)
        {
            throw new InvalidOperationException(
                "Password must be at least 8 characters."
            );
        }
    }

    private static void ValidateLoginRequest(LoginRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            throw new InvalidOperationException("Email is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.Password))
        {
            throw new InvalidOperationException("Password is required.");
        }
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToUpperInvariant();
    }

    private string? GetClientIpAddress()
    {
        var httpContext = _httpContextAccessor.HttpContext;

        if (httpContext == null)
        {
            return null;
        }

        var forwardedFor =
            httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(forwardedFor))
        {
            return forwardedFor.Split(",")[0].Trim();
        }

        return httpContext.Connection.RemoteIpAddress?.ToString();
    }

    private string? GetUserAgent()
    {
        return _httpContextAccessor.HttpContext?
            .Request
            .Headers
            .UserAgent
            .ToString();
    }
}