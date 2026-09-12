using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Auth;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Enums.Auth;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;
using TanishElectronics.Api.Interfaces.Services.AuthService;
using TanishElectronics.Api.Services.Helpers;
using TanishElectronics.Api.Settings;

namespace TanishElectronics.Api.Services.AuthService.CredentialAuth;

public class CredentialAuthService : ICredentialAuthService
{
    private readonly ICustomAuthRepository _authRepository;
    private readonly IAuthEventLogger _authEventLogger;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ISessionService _sessionService;
    private readonly IPasswordHasherService _hasherService;
    private readonly ITokenService _tokenService;
    public CredentialAuthService
    (
        ICustomAuthRepository authRepository,
        IAuthEventLogger authEventLogger,
        IJwtTokenService jwtTokenService,
        ISessionService sessionService,
        IPasswordHasherService hasherService,
        ITokenService tokenService
    )
    {
        _authRepository = authRepository;
        _authEventLogger = authEventLogger;
        _jwtTokenService = jwtTokenService;
        _sessionService = sessionService;
        _hasherService = hasherService;
        _tokenService = tokenService;
    }
    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto dto)
    {
        ValidateRegisterRequest(dto);

        var normalizedEmail = AuthHelpers.NormalizeEmail(dto.Email);

        var emailExists = await _authRepository.EmailExistsAsync(normalizedEmail);

        if (emailExists)
        {
            await _authEventLogger.LogAsync(
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

        await _authRepository.CreateCustomerProfileIfMissingAsync(user);

        var roles = await _authRepository.GetUserRolesAsync(user.AppUserId);

        var userSession = await _sessionService.CreateUserSessionAsync(user.AppUserId);

        var refreshToken = _jwtTokenService.GenerateRefreshToken();

        await _tokenService.SaveRefreshTokenAsync(user.AppUserId, userSession.UserSessionId, refreshToken);

        await _authEventLogger.LogAsync(
            user.AppUserId,
            user.Email,
            AuthEventType.RegisterSucceeded,
            true,
            "User registered successfully."
        );

        return _jwtTokenService.GenerateAuthResponse(user, roles, refreshToken, userSession.UserSessionId);
    }
    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto)
    {
        ValidateLoginRequest(dto);

        var normalizedEmail = AuthHelpers.NormalizeEmail(dto.Email);

        var user = await _authRepository.GetUserByNormalizedEmailAsync(normalizedEmail);

        if (user == null)
        {
            await _authEventLogger.LogAsync(
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
            await _authEventLogger.LogAsync(
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
            await _authEventLogger.LogAsync(
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
                await _authEventLogger.LogAsync(
                    user.AppUserId,
                    user.Email,
                    AuthEventType.AccountLocked,
                    false,
                    "Account locked after too many failed login attempts."
                );
            }
            await _authRepository.UpdateUserAsync(user);

            await _authEventLogger.LogAsync(
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

        var userSession = await _sessionService.CreateUserSessionAsync(user.AppUserId);

        var refreshToken = _jwtTokenService.GenerateRefreshToken();

        await _tokenService.SaveRefreshTokenAsync(user.AppUserId, userSession.UserSessionId, refreshToken);

        await _authEventLogger.LogAsync(
            user.AppUserId,
            user.Email,
            AuthEventType.LoginSucceeded,
            true,
            "User logged in successfully"
        );

        return _jwtTokenService.GenerateAuthResponse(user, roles, refreshToken, userSession.UserSessionId);
    }

    private static void ValidateRegisterRequest(RegisterRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName)) throw new InvalidOperationException("Full name is required.");

        if (string.IsNullOrWhiteSpace(dto.Email)) throw new InvalidOperationException("Email is required.");

        if (string.IsNullOrWhiteSpace(dto.Password)) throw new InvalidOperationException("Password is required.");

        if (dto.Password.Length < 8) throw new InvalidOperationException("Password must be at least 8 characters.");
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
}