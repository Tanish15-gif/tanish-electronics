using System.Security.Claims;
using Google.Apis.Auth;
using Microsoft.Extensions.Options;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Auth;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Enums.Auth;
using TanishElectronics.Api.Exceptions;
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
    private readonly GoogleAuthSettings _googleAuthSettings;
    private readonly IEmailService _emailService;
    private readonly IOtpSecurityService _otpSecurityService;
    private readonly OtpSettings _otpSettings;
    private readonly IPasswordResetTokenService _passwordResetTokenService;
    private readonly IUserAgentParser _userAgentParser;
    public CustomAuthService
    (
        ICustomAuthRepository authRepository,
        IPasswordHasherService hasherService,
        IJwtTokenService jwtTokenService,
        IHttpContextAccessor httpContextAccessor,
        IOptions<JwtSettings> jwtOptions,
        IOptions<GoogleAuthSettings> googleAuthSettings,
        IEmailService emailService,
        IOtpSecurityService otpSecurityService,
        IOptions<OtpSettings> options,
        IPasswordResetTokenService passwordResetTokenService,
        IUserAgentParser userAgentParser
    )
    {
        _authRepository = authRepository;
        _hasherService = hasherService;
        _jwtTokenService = jwtTokenService;
        _httpContextAccessor = httpContextAccessor;
        _jwtSettings = jwtOptions.Value;
        _googleAuthSettings = googleAuthSettings.Value;
        _emailService = emailService;
        _otpSecurityService = otpSecurityService;
        _otpSettings = options.Value;
        _passwordResetTokenService = passwordResetTokenService;
        _userAgentParser = userAgentParser;
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

        await _authRepository.CreateCustomerProfileIfMissingAsync(user);

        var roles = await _authRepository.GetUserRolesAsync(user.AppUserId);

        var userSession = await CreateUserSessionAsync(user.AppUserId);

        var refreshToken = _jwtTokenService.GenerateRefreshToken();

        await SaveRefreshTokenAsync(user.AppUserId, userSession.UserSessionId, refreshToken);

        await LogAuthEventAsync(
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

        var userSession = await CreateUserSessionAsync(user.AppUserId);

        var refreshToken = _jwtTokenService.GenerateRefreshToken();

        await SaveRefreshTokenAsync(user.AppUserId, userSession.UserSessionId, refreshToken);

        await LogAuthEventAsync(
            user.AppUserId,
            user.Email,
            AuthEventType.LoginSucceeded,
            true,
            "User logged in successfully"
        );

        return _jwtTokenService.GenerateAuthResponse(user, roles, refreshToken, userSession.UserSessionId);
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
        if (
            storedToken.UserSessionId == null ||
            storedToken.UserSession == null ||
            storedToken.UserSession.RevokedAt != null
        ) throw new UnauthorizedAccessException("Session is not longer active");

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

        await SaveRefreshTokenAsync(user.AppUserId, storedToken.UserSessionId.Value, newRefreshToken);

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

        await _authRepository.TouchUserSessionAsync(storedToken.UserSessionId.Value, GetClientIpAddress());

        return _jwtTokenService.GenerateAuthResponse(
            user,
            roles,
            newRefreshToken,
            storedToken.UserSessionId.Value
        );
    }

    public async Task LogoutAsync(LogoutRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RefreshToken))
        {
            return;
        }

        var now = DateTime.UtcNow;
        var revokedByIp = GetClientIpAddress();

        var tokenHash = _jwtTokenService.HashRefreshToken(dto.RefreshToken);

        var storedToken = await _authRepository.GetRefreshTokenByHashAsync(
            tokenHash
        );

        if (storedToken == null || storedToken.RevokedAt != null)
        {
            return;
        }

        if (storedToken!.UserSession != null && storedToken.UserSession.RevokedAt == null)
        {
            storedToken.UserSession.RevokedAt = now;
            storedToken.UserSession.RevokedByIp = revokedByIp;
        }

        await _authRepository.RevokeRefreshTokenAsync(
            storedToken,
            revokedByIp
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


    #region Google Auth

    public async Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.IdToken))
        {
            throw new UnauthorizedAccessException("Google token is required");
        }
        if (string.IsNullOrWhiteSpace(_googleAuthSettings.ClientId))
        {
            throw new UnauthorizedAccessException("google client id is missing");
        }

        GoogleJsonWebSignature.Payload payload;

        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(
                dto.IdToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { _googleAuthSettings.ClientId }
                }
            );
        }
        catch
        {
            await LogAuthEventAsync(
                null,
                null,
                AuthEventType.LoginFailed,
                false,
                "Invalid Google Token."
            );
            throw new UnauthorizedAccessException("Invalid Google Token");
        }
        if (string.IsNullOrWhiteSpace(payload.Email))
        {
            throw new UnauthorizedAccessException("Google account email was not found.");
        }

        if (!payload.EmailVerified)
        {
            throw new UnauthorizedAccessException("Google email is not verified.");
        }

        if (string.IsNullOrWhiteSpace(payload.Subject))
        {
            throw new UnauthorizedAccessException("Google account identifier was not found.");
        }

        var provider = ExternalLoginProvider.Google.ToString();
        var providerUserId = payload.Subject.Trim();
        var normalizedEmail = NormalizeEmail(payload.Email);

        var externalLogin = await _authRepository.GetExternalLoginAsync(provider, providerUserId);

        AppUser? user = externalLogin?.AppUser;

        var userWasCreated = false;

        if (user == null)
        {
            user = await _authRepository.GetUserByNormalizedEmailAsync(normalizedEmail);

            if (user == null)
            {
                var hasGooglePicture = !string.IsNullOrWhiteSpace(payload.Picture);

                user = new AppUser
                {
                    ClerkUserId = null,

                    FullName = string.IsNullOrWhiteSpace(payload.Name)
                        ? payload.Email.Trim()
                        : payload.Name.Trim(),

                    Email = payload.Email.Trim(),
                    NormalizedEmail = normalizedEmail,
                    PhoneNumber = null,
                    PasswordHash = null,

                    EmailConfirmed = true,
                    IsActive = true,
                    AccessFailedCount = 0,

                    ProfileImageUrl = hasGooglePicture
                        ? payload.Picture : null,

                    ProfileImageSource = hasGooglePicture
                        ? provider : null,

                    ProfileImageUpdatedAt = hasGooglePicture
                        ? DateTime.UtcNow
                        : null,

                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow,
                    LastSeenAt = DateTime.UtcNow
                };

                await _authRepository.CreateUserAsync(user);

                await _authRepository.AssignRoleAsync(user.AppUserId, RoleNames.Customer);

                await _authRepository.CreateCustomerProfileIfMissingAsync(user);

                userWasCreated = true;

                await LogAuthEventAsync(
                    user.AppUserId,
                    user.Email,
                    AuthEventType.RegisterSucceeded,
                    true,
                    "User registered with Google."
                );
            }
            else
            {
                EnsureUserIsActive(user);
            }

            // Existing User update profile and all.

            if (!userWasCreated)
            {
                user.EmailConfirmed = true;
                user.LastLoginAt = DateTime.UtcNow;
                user.LastSeenAt = DateTime.UtcNow;

                var canUseGoogleAvatar = string.IsNullOrWhiteSpace(user.ProfileImageUrl) ||
                    string.Equals(
                        user.ProfileImageSource,
                        provider,
                        StringComparison.OrdinalIgnoreCase
                    );

                if (canUseGoogleAvatar && !string.IsNullOrWhiteSpace(payload.Picture))
                {
                    user.ProfileImageUrl = payload.Picture;
                    user.ProfileImageSource = provider;
                    user.ProfileImageUpdatedAt = DateTime.UtcNow;
                }
                await _authRepository.UpdateUserAsync(user);
            }

        }
        if (externalLogin == null)
        {
            var newExternalLogin = new ExternalLogin
            {
                AppUserId = user.AppUserId,
                Provider = provider,
                ProviderUserId = providerUserId,
                Email = payload.Email.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            await _authRepository.AddExternalLoginAsync(
                newExternalLogin
            );
        }
        var roles = await _authRepository.GetUserRolesAsync(user.AppUserId);

        var userSession = await CreateUserSessionAsync(user.AppUserId);

        var refreshToken = _jwtTokenService.GenerateRefreshToken();

        await SaveRefreshTokenAsync(user.AppUserId, userSession.UserSessionId, refreshToken);

        await LogAuthEventAsync(
            user.AppUserId,
            user.Email,
            AuthEventType.LoginSucceeded,
            true,
            "User logged in with Google."
        );

        return _jwtTokenService.GenerateAuthResponse(user, roles, refreshToken, userSession.UserSessionId);
    }

    #endregion


    #region Forgot Password
    public async Task RequestForgotPasswordOtpAsync(ForgotPasswordRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email)) throw new InvalidOperationException("Email is required");

        var normalizedEmail = NormalizeEmail(dto.Email);

        var user = await _authRepository.GetUserByNormalizedEmailAsync(normalizedEmail);

        if (user == null || user.DeletedAt != null) throw new KeyNotFoundException("No account is registered with this email.");
        if (!user.IsActive) throw new InvalidOperationException("This account is currently inactive");
        if (string.IsNullOrWhiteSpace(user.PasswordHash)) throw new InvalidOperationException("This account uses Google sign-in. Please sign in with Google.");

        var purpose = OtpPurpose.ForgotPassword.ToString();

        var latestOtp = await _authRepository.GetLatestOtpAsync(normalizedEmail, purpose);

        var resendAllowedAt = latestOtp?.CreatedAt.AddSeconds(_otpSettings.ResendCooldownSeconds);

        if (resendAllowedAt.HasValue && resendAllowedAt.Value > DateTime.UtcNow) return;

        await _authRepository.InvalidateActiveOtpsAsync(normalizedEmail, purpose);

        var plainCode = _otpSecurityService.GenerateCode();

        var codeHash = _otpSecurityService.HashCode(normalizedEmail, purpose, plainCode);

        var otpEntity = new OtpCode
        {
            AppUserId = user.AppUserId,
            Email = user.Email,
            NormalizedEmail = normalizedEmail,
            Purpose = purpose,
            CodeHash = codeHash,

            ExpiresAt = DateTime.UtcNow.AddMinutes(_otpSettings.ExpiryMinutes),

            ConsumedAt = null,
            AttemptCount = 0,
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = GetClientIpAddress()
        };

        await _authRepository.AddOtpAsync(otpEntity);

        try
        {
            var safeName = System.Net.WebUtility.HtmlEncode(user.FullName);

            var htmlBody = $"""
            <!DOCTYPE html>
            <html>
            <body style="margin:0;background:#f7f5ef;font-family:Arial,sans-serif;color:#1f1a12;">
                <div style="max-width:560px;margin:40px auto;padding:24px;">
                    <div style="background:#fffdf7;border:1px solid #d8cdb6;border-radius:24px;padding:32px;">
                        <p style="margin:0;color:#8a6624;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
                            Tanish Electronics
                        </p>

                        <h1 style="margin:20px 0 10px;font-size:28px;">
                            Reset your password
                        </h1>

                        <p style="line-height:1.7;color:#6f6758;">
                            Hello {safeName}, use the verification code below to continue resetting your password.
                        </p>

                        <div style="margin:28px 0;padding:20px;text-align:center;background:#f2eadb;border-radius:16px;font-size:34px;font-weight:800;letter-spacing:10px;color:#1f1a12;">
                            {plainCode}
                        </div>

                        <p style="line-height:1.7;color:#6f6758;">
                            This code expires in {_otpSettings.ExpiryMinutes} minutes.
                        </p>

                        <p style="margin-top:24px;font-size:13px;line-height:1.6;color:#817867;">
                            If you did not request a password reset, you can safely ignore this email.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """;

            var textBody = $"""
                Tanish Electronics password reset

                Hello {user.FullName},

                Your password reset code is: {plainCode}

                This code expires in {_otpSettings.ExpiryMinutes} minutes.

                If you did not request this, ignore this email.
            """;

            await _emailService.SendAsync(
                user.Email,
                "Your Tanish Electronics password reset code",
                htmlBody,
                textBody)
            ;
        }
        catch
        {
            await _authRepository.InvalidateActiveOtpsAsync(normalizedEmail, purpose);
            throw;
        }
    }
    #endregion

    #region Reset Password

    public async Task ResetPasswordAsync(ResetPasswordRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ResetToken)) throw new InvalidOperationException("Invalid or expired reset session.");

        if (string.IsNullOrWhiteSpace(dto.NewPassword)) throw new InvalidOperationException("New password is required.");

        if (dto.NewPassword.Length < 8) throw new InvalidOperationException("Password must be at least 8 characters.");

        var tokenHash =
            _passwordResetTokenService.HashToken(
                dto.ResetToken
            );

        var resetSession =
            await _authRepository
                .GetPasswordResetSessionByHashAsync(
                    tokenHash
                );

        if (
            resetSession == null ||
            resetSession.ConsumedAt != null ||
            resetSession.ExpiresAt <= DateTime.UtcNow
        )
        {
            throw new InvalidOperationException(
                "Invalid or expired reset session."
            );
        }

        var user = resetSession.AppUser;

        if (
            user == null ||
            !user.IsActive ||
            user.DeletedAt != null
        )
        {
            throw new InvalidOperationException(
                "Invalid or expired reset session."
            );
        }

        user.PasswordHash =
            _hasherService.HashPassword(
                dto.NewPassword
            );

        user.PasswordUpdatedAt = DateTime.UtcNow;
        user.EmailConfirmed = true;
        user.AccessFailedCount = 0;
        user.LockoutEndAt = null;

        await _authRepository.CompletePasswordResetAsync(
            user,
            resetSession,
            GetClientIpAddress()
        );
    }

    public async Task<VerifyForgotPasswordOtpResponseDto> VerifyForgotPasswordOtpAsync(VerifyForgotPasswordOtpRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            throw new InvalidOperationException(
                "Email is required."
            );
        }

        var code = dto.Code?.Trim() ?? string.Empty;

        if (code.Length != 6 || !code.All(char.IsDigit))
        {
            throw new InvalidOperationException(
                "Invalid or expired verification code."
            );
        }

        var normalizedEmail = NormalizeEmail(dto.Email);

        var user =
            await _authRepository
                .GetUserByNormalizedEmailAsync(
                    normalizedEmail
                );

        if (
            user == null ||
            !user.IsActive ||
            user.DeletedAt != null
        )
        {
            throw new InvalidOperationException(
                "Invalid or expired verification code."
            );
        }

        var purpose =
            OtpPurpose.ForgotPassword.ToString();

        var otp =
            await _authRepository.GetLatestActiveOtpAsync(
                normalizedEmail,
                purpose
            );

        if (otp == null)
        {
            throw new InvalidOperationException(
                "Invalid or expired verification code."
            );
        }

        var now = DateTime.UtcNow;

        if (
            otp.ExpiresAt <= now ||
            otp.AttemptCount >= _otpSettings.MaxAttempts
        )
        {
            otp.ConsumedAt = now;

            await _authRepository.UpdateOtpAsync(otp);

            throw new InvalidOperationException(
                "Invalid or expired verification code."
            );
        }

        var valid =
            _otpSecurityService.VerifyCode(
                normalizedEmail,
                purpose,
                code,
                otp.CodeHash
            );

        if (!valid)
        {
            otp.AttemptCount += 1;

            if (
                otp.AttemptCount >=
                _otpSettings.MaxAttempts
            )
            {
                otp.ConsumedAt = now;
            }

            await _authRepository.UpdateOtpAsync(otp);

            throw new InvalidOperationException(
                "Invalid or expired verification code."
            );
        }

        var plainResetToken =
            _passwordResetTokenService.GenerateToken();

        var resetTokenHash =
            _passwordResetTokenService.HashToken(
                plainResetToken
            );

        var resetSession = new PasswordResetSession
        {
            AppUserId = user.AppUserId,
            TokenHash = resetTokenHash,

            ExpiresAt = now.AddMinutes(
                _otpSettings.ResetTokenExpiryMinutes
            ),

            ConsumedAt = null,
            CreatedAt = now,
            CreatedByIp = GetClientIpAddress()
        };

        await _authRepository
            .ConsumeOtpAndCreateResetSessionAsync(
                otp,
                resetSession
            );

        return new VerifyForgotPasswordOtpResponseDto
        {
            ResetToken = plainResetToken,

            ExpiresInSeconds =
                _otpSettings.ResetTokenExpiryMinutes * 60
        };
    }

    #endregion

    private async Task SaveRefreshTokenAsync(int appUserId, Guid userSessionId, string refreshToken)
    {
        var tokenHash = _jwtTokenService.HashRefreshToken(refreshToken);

        var refreshTokenEntity = new RefreshToken
        {
            AppUserId = appUserId,
            UserSessionId = userSessionId,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenDays),
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = GetClientIpAddress(),
            UserAgent = GetUserAgent()
        };

        await _authRepository.AddRefreshTokenAsync(refreshTokenEntity);
    }

    private static void EnsureUserIsActive(AppUser appUser)
    {
        if (!appUser.IsActive || appUser.DeletedAt != null)
        {
            throw new UnauthorizedAccessException("Account is Inactive");
        }
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
    private int GetAuthenticatedUserId()
    {
        var userIdValue = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdValue, out var appUserId)) throw new UnauthorizedAccessException("Authenticated user was not found.");

        return appUserId;
    }

    #region Account Security
    public async Task<SecuritySummaryResponseDto> GetSecuritySummaryAsync()
    {
        var appUserId = GetAuthenticatedUserId();

        var user = await _authRepository.GetUserByIdWithExternalLoginsAsync(appUserId);

        var activeSessionCount = await _authRepository.GetActiveUserSessionCountAsync(appUserId);

        if (user == null || !user.IsActive || user.DeletedAt != null)
            throw new UnauthorizedAccessException("Account was not found");

        var connectedProviders = user.ExternalLogins
            .Select(login => login.Provider)
            .Where(provider => !string.IsNullOrWhiteSpace(provider))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(provider => provider)
            .ToList();

        return new SecuritySummaryResponseDto
        {
            HasPassword = !string.IsNullOrWhiteSpace(user.PasswordHash),

            EmailConfirmed = user.EmailConfirmed,
            PasswordUpdatedAt = user.PasswordUpdatedAt,
            ConnectedProviders = connectedProviders,
            ActiveSessionCount = activeSessionCount
        };
    }

    public async Task ChangePasswordAsync(ChangePasswordRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CurrentPassword)) throw new BadRequestException("Current password is required.");

        if (string.IsNullOrWhiteSpace(dto.NewPassword)) throw new InvalidOperationException("New password is required.");

        if (dto.NewPassword.Length < 8) throw new InvalidOperationException("New password must be at least 8 characters.");

        var appUserId = GetAuthenticatedUserId();

        var user = await _authRepository.GetUserByIdWithExternalLoginsAsync(appUserId);

        if (user == null || !user.IsActive || user.DeletedAt != null) throw new UnauthorizedAccessException("Account not found");

        if (string.IsNullOrWhiteSpace(user.PasswordHash)) throw new InvalidOperationException("This account does not have a password yet.");

        var now = DateTime.UtcNow;

        var CurrentPasswordValid = _hasherService.VerifyPassword(dto.CurrentPassword, user.PasswordHash);

        if (!CurrentPasswordValid) throw new BadRequestException("Current password is incorrect.");

        var samePassword = _hasherService.VerifyPassword(dto.NewPassword, user.PasswordHash);

        if (samePassword) throw new BadRequestException("New password must be different from the current password.");

        user.PasswordHash = _hasherService.HashPassword(dto.NewPassword);

        user.PasswordUpdatedAt = now;
        user.UpdatedAt = now;
        user.AccessFailedCount = 0;
        user.LockoutEndAt = null;

        await _authRepository.CompletePasswordChangeAsync(user, GetClientIpAddress());
    }
    #endregion

    #region Google set Password

    public async Task<GooglePasswordReauthResponseDto> ReauthenticateGoogleForPasswordAsync(GooglePasswordReauthRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.IdToken)) throw new InvalidOperationException("Google token is required");

        var appUserId = GetAuthenticatedUserId();

        var user = await _authRepository.GetUserByIdWithExternalLoginsAsync(appUserId);

        if (user == null || !user.IsActive || user.DeletedAt != null) throw new UnauthorizedAccessException("Account not found");

        if (!string.IsNullOrWhiteSpace(user.PasswordHash)) throw new InvalidOperationException("This account already has a password.");

        var googleProvider = ExternalLoginProvider.Google.ToString();

        var linkedGoogleAccount = user.ExternalLogins.FirstOrDefault(login =>
            string.Equals(
                login.Provider,
                googleProvider,
                StringComparison.OrdinalIgnoreCase
            )
        );

        if (linkedGoogleAccount == null) throw new InvalidOperationException("No Google account is connected");

        GoogleJsonWebSignature.Payload payload;

        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(
                dto.IdToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience =
                        new[]
                        {
                            _googleAuthSettings.ClientId
                        }
                }
            );
        }
        catch
        {
            throw new UnauthorizedAccessException("Google verification failed.");
        }

        if (!payload.EmailVerified || string.IsNullOrWhiteSpace(payload.Subject)) throw new UnauthorizedAccessException("Google verification failed.");

        if (!string.Equals(
            linkedGoogleAccount.ProviderUserId,
            payload.Subject.Trim(),
            StringComparison.Ordinal
            )
        )
        {
            throw new UnauthorizedAccessException("Please verify using the Google account connected to this profile.");
        }

        if (payload.IssuedAtTimeSeconds is not long issuedAtSeconds) throw new UnauthorizedAccessException("Google verification session is invalid.");

        var issuedAt = DateTimeOffset.FromUnixTimeSeconds(issuedAtSeconds);

        var tokenAge = DateTimeOffset.UtcNow - issuedAt;

        if (tokenAge < TimeSpan.Zero || tokenAge > TimeSpan.FromMinutes(5)) throw new UnauthorizedAccessException("Google verification expired. Please try again.");

        var plainSetUpToken = _passwordResetTokenService.GenerateToken();

        var setUpTokenHash = _passwordResetTokenService.HashToken(plainSetUpToken);

        var now = DateTime.UtcNow;

        var setupSession = new PasswordResetSession
        {
            AppUserId = user.AppUserId,
            TokenHash = setUpTokenHash,

            ExpiresAt = now.AddMinutes(
                _otpSettings.ResetTokenExpiryMinutes
            ),

            ConsumedAt = null,
            CreatedAt = now,
            CreatedByIp = GetClientIpAddress()
        };
        await _authRepository.CreatePasswordSetupSessionAsync(setupSession);

        return new GooglePasswordReauthResponseDto
        {
            SetupToken = plainSetUpToken,
            ExpiresInSeconds = _otpSettings.ResetTokenExpiryMinutes * 60
        };
    }

    public async Task CompleteSetPasswordAsync(CompleteSetPasswordRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.SetupToken)) throw new InvalidOperationException("Invalid or expired setup session.");

        if (string.IsNullOrWhiteSpace(dto.NewPassword)) throw new InvalidOperationException("New password is required.");

        if (dto.NewPassword.Length < 8) throw new InvalidOperationException("Password must be at least 8 characters.");

        var appUserId = GetAuthenticatedUserId();

        var tokenHash = _passwordResetTokenService.HashToken(dto.SetupToken);

        var setUpSession = await _authRepository.GetPasswordResetSessionByHashAsync(tokenHash);

        if (
            setUpSession == null ||
            setUpSession.AppUserId != appUserId ||
            setUpSession.ConsumedAt != null ||
            setUpSession.ExpiresAt <= DateTime.UtcNow
        )
        {
            throw new InvalidOperationException("Invalid or expired setup session.");
        }
        var user = setUpSession.AppUser;

        if (user == null || !user.IsActive || user.DeletedAt != null) throw new UnauthorizedAccessException("Account was not found.");

        if (!string.IsNullOrWhiteSpace(user.PasswordHash)) throw new InvalidOperationException("This account already has a password.");

        var now = DateTime.UtcNow;

        user.PasswordHash = _hasherService.HashPassword(dto.NewPassword);

        user.PasswordUpdatedAt = now;
        user.UpdatedAt = now;
        user.EmailConfirmed = true;
        user.AccessFailedCount = 0;
        user.LockoutEndAt = null;

        await _authRepository.CompletePasswordSetupAsync(user, setUpSession);
    }

    #endregion


    #region  Sessions

    public async Task SignOutOtherSessionsAsync(SignOutOtherSessionsRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CurrentRefreshToken)) throw new UnauthorizedAccessException("Current session was not found.");

        var appUserId = GetAuthenticatedUserId();

        var currentTokenHash = _jwtTokenService.HashRefreshToken(dto.CurrentRefreshToken);

        var currentToken = await _authRepository.GetRefreshTokenByHashAsync(currentTokenHash);

        if (
            currentToken == null ||
            currentToken.AppUserId != appUserId ||
            currentToken.RevokedAt != null ||
            currentToken.ExpiresAt <= DateTime.UtcNow
        )
        {
            throw new UnauthorizedAccessException("Current session is invalid.");
        }

        await _authRepository.RevokeOtherSessionsAsync(appUserId, currentToken.UserSessionId!.Value, GetClientIpAddress());
    }

    public async Task SignOutAllSessionsAsync()
    {
        var appUserId = GetAuthenticatedUserId();

        await _authRepository.RevokeAllRefreshTokensAsync(appUserId, GetClientIpAddress());
    }

    public async Task<List<ActiveSessionDto>> GetActiveSessionsAsync()
    {
        var appUserId = GetAuthenticatedUserId();
        var currentSessionId = GetAuthenticatedSessionId();

        var sessions =
            await _authRepository
                .GetActiveUserSessionsAsync(appUserId);

        return sessions.Select(session =>
            new ActiveSessionDto
            {
                UserSessionId = session.UserSessionId,
                DeviceType = session.DeviceType,
                DeviceName = session.DeviceName,
                BrowserName = session.BrowserName,
                BrowserVersion = session.BrowserVersion,
                OperatingSystem = session.OperatingSystem,
                IpAddress = session.IpAddress,
                CreatedAt = session.CreatedAt,
                LastSeenAt = session.LastSeenAt,

                IsCurrent =
                    session.UserSessionId == currentSessionId
            }
        ).ToList();
    }

    #endregion


    private async Task<UserSession> CreateUserSessionAsync(int appUserId)
    {
        var userAgent = GetUserAgent();

        var details =
            _userAgentParser.Parse(userAgent);

        var now = DateTime.UtcNow;

        var session = new UserSession
        {
            AppUserId = appUserId,

            DeviceType = details.DeviceType,
            DeviceName = details.DeviceName,

            BrowserName = details.BrowserName,
            BrowserVersion = details.BrowserVersion,

            OperatingSystem =
                details.OperatingSystem,

            UserAgent = userAgent,
            IpAddress = GetClientIpAddress(),

            CreatedAt = now,
            LastSeenAt = now,

            RevokedAt = null,
            RevokedByIp = null
        };

        return await _authRepository
            .AddUserSessionAsync(session);
    }

    private Guid GetAuthenticatedSessionId()
    {
        var sessionIdValue =
            _httpContextAccessor.HttpContext?
                .User
                .FindFirstValue("sid");

        if (!Guid.TryParse(sessionIdValue, out var sessionId))
        {
            throw new UnauthorizedAccessException(
                "Current session was not found."
            );
        }

        return sessionId;
    }

    public async Task RevokeSessionAsync(Guid userSessionId)
    {
        var appUserId = GetAuthenticatedUserId();
        var currentSessionId = GetAuthenticatedSessionId();

        if (userSessionId == Guid.Empty) throw new BadRequestException("Session identifier is required");
        if (userSessionId == currentSessionId) throw new BadRequestException("Use normal sign out to end the current session.");

        var revoked = await _authRepository.RevokeUserSessionAsync(appUserId, userSessionId, GetClientIpAddress());

        if (!revoked) throw new KeyNotFoundException("Active session not found");
    }
}