using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.BackgroundServices;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.Delegates;
using TanishElectronics.Api.Helpers;
using TanishElectronics.Api.Hubs;
using TanishElectronics.Api.Interfaces.Events;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;
using TanishElectronics.Api.Repositories;
using TanishElectronics.Api.Services;
using TanishElectronics.Api.Settings;
using System.Threading.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using TanishElectronics.Api.Middleware;
using Microsoft.AspNetCore.Authorization;
using TanishElectronics.Api.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using TanishElectronics.Api.Interfaces.Common;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();

builder.Logging.AddSimpleConsole(options =>
{
    options.SingleLine = true;
    options.TimestampFormat = "HH:mm:ss ";
});

builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSignalR();
builder.Services.AddHttpContextAccessor();
builder.Services.AddMemoryCache();

builder.Services.Configure<GoogleAuthSettings>(
    builder.Configuration.GetSection("GoogleAuth")
);

builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("JwtSettings")
);

var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();

if (jwtSettings == null || string.IsNullOrWhiteSpace(jwtSettings.SecretKey))
{
    throw new InvalidOperationException("Jwt settings are missing");
}

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = AuthSchemes.CustomJwt;
        options.DefaultChallengeScheme = AuthSchemes.CustomJwt;
        options.DefaultScheme = AuthSchemes.CustomJwt;
    })
    .AddJwtBearer(AuthSchemes.CustomJwt, options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,


            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
            ClockSkew = TimeSpan.Zero
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) &&
                    path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            },
            OnTokenValidated = async context =>
            {
                var userIdValue = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
                var sessionIdValue = context.Principal?.FindFirstValue("sid");

                if (!int.TryParse(userIdValue, out var appUserId) || !Guid.TryParse(sessionIdValue, out var sessionId))
                {
                    context.Fail("Invalid authentication session.");
                    return;
                }

                var dbContext = context.HttpContext.RequestServices.GetRequiredService<TanishElectronicsDbContext>();

                var sessionIsActive = await dbContext.UserSessions
                    .AsNoTracking()
                    .AnyAsync(session =>
                        session.UserSessionId == sessionId &&
                        session.AppUserId == appUserId &&
                        session.RevokedAt == null
                    );

                if (!sessionIsActive) context.Fail("This session has been revoked.");
            }
        };
    });

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
            .Where(entry => entry.Value?.Errors.Count > 0)
            .SelectMany(entry => entry.Value!.Errors.Select(error => new
            {
                field = entry.Key,
                message = error.ErrorMessage
            }))
            .ToList();

        var firstMessage = errors.FirstOrDefault()?.message ?? "Invalid request data";

        return new BadRequestObjectResult(new
        {
            statusCode = StatusCodes.Status400BadRequest,
            message = firstMessage,
            errors,
            traceId = context.HttpContext.TraceIdentifier
        });
    };
});

builder.Services.AddDbContext<TanishElectronicsDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
    sqlOptions =>
    {
        sqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SingleQuery);
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

builder.Services.AddOptions<EmailSettings>()
    .Bind(
        builder.Configuration.GetSection(
            EmailSettings.SectionName
        )
    )
    .Validate(
        settings =>
            !string.IsNullOrWhiteSpace(settings.Host) &&
            settings.Port > 0 &&
            !string.IsNullOrWhiteSpace(settings.Username) &&
            !string.IsNullOrWhiteSpace(settings.Password) &&
            !string.IsNullOrWhiteSpace(settings.FromEmail),
        "Email configuration is incomplete."
    )
    .ValidateOnStart();

builder.Services
    .AddOptions<OtpSettings>()
    .Bind(
        builder.Configuration.GetSection(
            OtpSettings.SectionName
        )
    )
    .Validate(
        settings =>
            settings.ExpiryMinutes > 0 &&
            settings.ResendCooldownSeconds > 0 &&
            settings.MaxAttempts > 0 &&
            !string.IsNullOrWhiteSpace(settings.HashKey),
        "OTP configuration is incomplete."
    )
    .ValidateOnStart();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/json";

        await context.HttpContext.Response.WriteAsJsonAsync(
            new
            {
                message = "Too many Requests. Please wait and try again."
            },
            cancellationToken
        );
    };

    options.AddPolicy(RateLimitPolicies.PublicRead, httpcontext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: RateLimitKeyHelper.GetUserOrIpKey(httpcontext),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
                AutoReplenishment = true
            }
        ));
    options.AddPolicy(RateLimitPolicies.FormSubmit, httpcontext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: RateLimitKeyHelper.GetUserOrIpKey(httpcontext),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
                AutoReplenishment = true
            }
        ));
    options.AddPolicy(RateLimitPolicies.ImageUpload, httpcontext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: RateLimitKeyHelper.GetUserOrIpKey(httpcontext),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 8,
                Window = TimeSpan.FromMinutes(5),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
                AutoReplenishment = true
            }
        ));
    options.AddPolicy(RateLimitPolicies.AdminAction, httpcontext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: RateLimitKeyHelper.GetUserOrIpKey(httpcontext),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 80,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
                AutoReplenishment = true
            }
        ));
    options.AddPolicy(RateLimitPolicies.AuthAttempt, httpcontext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: RateLimitKeyHelper.GetUserOrIpKey(httpcontext),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(5),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
                AutoReplenishment = true
            }
        ));
    options.AddPolicy(RateLimitPolicies.OtpRequest, httpcontext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: RateLimitKeyHelper.GetUserOrIpKey(httpcontext),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 3,
                Window = TimeSpan.FromMinutes(10),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
                AutoReplenishment = true
            }
        ));
    options.AddPolicy(RateLimitPolicies.OtpVerify, httpcontext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: RateLimitKeyHelper.GetUserOrIpKey(httpcontext),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(5),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
                AutoReplenishment = true
            }
        ));
    options.AddPolicy(RateLimitPolicies.ChatMessage, httpcontext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: RateLimitKeyHelper.GetUserOrIpKey(httpcontext),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 15,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
                AutoReplenishment = true
            }
        ));
});

builder.Services.AddHealthChecks()
    .AddCheck<SqlServerLatencyHealthCheck>(
        "sql-server",
        failureStatus: HealthStatus.Unhealthy,
        tags: new[] { "ready", "database" }
    )
    .AddCheck<MemoryCacheHealthCheck>(
        "memory-cache",
        failureStatus: HealthStatus.Unhealthy,
        tags: new[] { "ready", "cache" }
    )
    .AddCheck<UploadStorageHealthCheck>(
        "upload-storage",
        failureStatus: HealthStatus.Unhealthy,
        tags: new[] { "ready", "storage" }
    )
    .AddCheck<SessionStoreHealthCheck>(
        "session-store",
        failureStatus: HealthStatus.Unhealthy,
        tags: new[] { "ready", "database" }
    );

builder.Services.AddOutputCache(options =>
{
    options.AddPolicy(OutputCachePolicies.PublicShort, cacheBuilder =>
        cacheBuilder.Expire(TimeSpan.FromSeconds(30))
    );
    options.AddPolicy(OutputCachePolicies.PublicProducts, cacheBuilder =>
        cacheBuilder
            .Expire(TimeSpan.FromSeconds(60))
            .SetVaryByQuery("category", "search", "page", "pageSize")
            .Tag(OutputCachePolicies.ProductsTag)
    );
    options.AddPolicy(OutputCachePolicies.PublicStatic, cacheBuilder =>
        cacheBuilder.Expire(TimeSpan.FromMinutes(10))
    );
});
builder.Services.AddScoped<IAuthorizationHandler, AppRoleAuthorizationHandler>();

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AppPolicies.AdminOnly, policy =>
    {
        policy.AuthenticationSchemes.Add(AuthSchemes.CustomJwt);

        policy.RequireAuthenticatedUser();
        policy.AddRequirements(new AppRoleRequirement(RoleNames.Admin, RoleNames.Owner));
    });
    options.AddPolicy(AppPolicies.CustomerOnly, policy =>
    {
        policy.AuthenticationSchemes.Add(AuthSchemes.CustomJwt);

        policy.RequireAuthenticatedUser();
        policy.AddRequirements(new AppRoleRequirement(RoleNames.Customer));
    });
    options.AddPolicy(AppPolicies.AdminOrCustomer, policy =>
    {
        policy.AuthenticationSchemes.Add(AuthSchemes.CustomJwt);

        policy.RequireAuthenticatedUser();
        policy.AddRequirements(new AppRoleRequirement(RoleNames.Admin, RoleNames.Owner, RoleNames.Customer));
    });
});

builder.Services.Configure<ShopSettings>(
    builder.Configuration.GetSection("ShopSettings"));


builder.Services.Configure<GroqSettings>(
    builder.Configuration.GetSection(GroqSettings.SectionName)
);

builder.Services.AddHttpClient<IChatbotService, ChatbotService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddScoped<ILookUpService, LookUpService>();

builder.Services.AddScoped<IServiceRequestRepository, ServiceRequestRepository>();
builder.Services.AddScoped<IServiceRequestService, ServiceRequestService>();

builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IProductService, ProductService>();

builder.Services.AddScoped<IEnquiryRepository, EnquiryRepository>();
builder.Services.AddScoped<IEnquiryService, EnquiryService>();

builder.Services.AddScoped<IAdminDashboardRepository, AdminDashboardRepository>();
builder.Services.AddScoped<IAdminDashboardService, AdminDashboardService>();

builder.Services.AddScoped<IAuthRepository, AuthRepository>();

builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

builder.Services.AddScoped<ICustomerDashboardRepository, CustomerDashboardRepository>();
builder.Services.AddScoped<ICustomerDashboardService, CustomerDashboardService>();

builder.Services.AddScoped<ICustomerProfileRepository, CustomerProfileRepository>();
builder.Services.AddScoped<ICustomerProfileService, CustomerProfileService>();

builder.Services.AddScoped<ICustomerAccountResolver, CustomerAccountResolver>();

builder.Services.AddScoped<ICustomerRepairsRepository, CustomerRepairsRepository>();
builder.Services.AddScoped<ICustomerRepairsService, CustomerRepairsService>();

builder.Services.AddScoped<IAdminRepairFeedbackRepository, AdminRepairFeedbackRepository>();
builder.Services.AddScoped<IAdminRepairFeedbackService, AdminRepairFeedbackService>();

builder.Services.AddScoped<IPublicRepairFeedbackRepository, PublicRepairFeedbackRepository>();
builder.Services.AddScoped<IPublicRepairFeedbackService, PublicRepairFeedbackService>();

builder.Services.AddScoped<IAnnouncementRepository, AnnouncementRepository>();
builder.Services.AddScoped<IAnnouncementService, AnnouncementService>();

builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<INotificationService, NotificationService>();

builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();

builder.Services.AddScoped<IWebsiteVisitRepository, WebsiteVisitRepository>();
builder.Services.AddScoped<IWebsiteVisitService, WebsiteVisitService>();

builder.Services.AddScoped<IShopSettingsRepository, ShopSettingsRepository>();
builder.Services.AddScoped<IShopSettingsService, ShopSettingsService>();

builder.Services.AddScoped<IAdminExportRepository, AdminExportRepository>();
builder.Services.AddScoped<IAdminExportService, AdminExportService>();

builder.Services.AddScoped<IAdminUsersRepository, AdminUsersRepository>();
builder.Services.AddScoped<IAdminUsersService, AdminUsersService>();

builder.Services.AddScoped<IPasswordHasherService, PasswordHasherService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

builder.Services.AddScoped<ICustomAuthRepository, CustomAuthRepository>();
builder.Services.AddScoped<ICustomAuthService, CustomAuthService>();

builder.Services.AddScoped<IEmailService, MailKitEmailService>();

builder.Services.AddHostedService<AnnouncementExpiryBackgroundService>();

builder.Services.AddScoped<IProductCreatedAnnouncementHandler, ProductCreatedAnnouncementHandler>();

builder.Services.AddScoped<IAnnouncementRealtimeNotifier, AnnouncementRealtimeNotifier>();

builder.Services.AddScoped<INotificationRealtimeNotifier, NotificationRealtimeNotifier>();

builder.Services.AddSingleton<IUserAgentParser, UserAgentParser>();
builder.Services.AddSingleton<IAppMemoryCacheService, AppMemoryCacheService>();

builder.Services.AddScoped<ICurrentUserContext, CurrentUserContext>();

builder.Services.AddScoped<IPublicOutputCacheInvalidator, PublicOutputCacheInvalidator>();

builder.Services.AddSingleton<IOtpSecurityService, OtpSecurityService>();
builder.Services.AddSingleton<IPasswordResetTokenService, PasswordResetTokenService>();


builder.Services.AddSingleton<PublicCustomerNameFormatter>(
    _ => PublicCustomerNameFormatterHelper.Format
);

builder.Services.AddSingleton<AnnouncementAudienceMatcher>(
    _ => AnnouncementAudienceMatcherHelper.Matches
);


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();

app.UseCors("AllowAll");

app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.UseRateLimiter();
app.UseOutputCache();

app.MapControllers();
app.MapHub<AnnouncementHub>("/hubs/announcements");
app.MapHub<NotificationHub>("/hubs/notifications");


app.MapHealthChecks("/health");
app.MapHealthChecks(
     "/health/details",
     new HealthCheckOptions
     {
         ResponseWriter = HealthCheckResponseWriter.WriteJsonResponse
     }
);
app.Run();
