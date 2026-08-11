using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TanishElectronics.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppUsers",
                columns: table => new
                {
                    AppUserId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClerkUserId = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    FullName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PasswordHash = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastSeenAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastLogoutAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AccessFailedCount = table.Column<int>(type: "int", nullable: false),
                    LockoutEndAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PasswordUpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ProfileImageUrl = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    ProfileImageSource = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    ProfileImageUpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__AppUsers__FC65C73016001A02", x => x.AppUserId);
                });

            migrationBuilder.CreateTable(
                name: "EnquiryStatuses",
                columns: table => new
                {
                    EnquiryStatusId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StatusName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__EnquiryS__C8FB76E203611CE3", x => x.EnquiryStatusId);
                });

            migrationBuilder.CreateTable(
                name: "ProductCategories",
                columns: table => new
                {
                    ProductCategoryId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CategoryName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ProductC__3224ECCE5A079966", x => x.ProductCategoryId);
                });

            migrationBuilder.CreateTable(
                name: "ProductConditions",
                columns: table => new
                {
                    ProductConditionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConditionName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ProductC__D6ABB173646A7755", x => x.ProductConditionId);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    RoleId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Roles__8AFACE1A9C878CA8", x => x.RoleId);
                });

            migrationBuilder.CreateTable(
                name: "ServiceCategories",
                columns: table => new
                {
                    ServiceCategoryId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CategoryName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ServiceC__E4CC7EAA8FB47EA1", x => x.ServiceCategoryId);
                });

            migrationBuilder.CreateTable(
                name: "ServiceLocations",
                columns: table => new
                {
                    ServiceLocationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LocationName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false, defaultValue: "Mumbai"),
                    PinCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    IsHomeVisitAvailable = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ServiceL__8CC619AC581EADC8", x => x.ServiceLocationId);
                });

            migrationBuilder.CreateTable(
                name: "ServiceStatus",
                columns: table => new
                {
                    ServiceStatusId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StatusName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ServiceS__009D5ED9C9007FDA", x => x.ServiceStatusId);
                });

            migrationBuilder.CreateTable(
                name: "ShopBusinessSettings",
                columns: table => new
                {
                    ShopBusinessSettingId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ShopName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    OwnerName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    PrimaryPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SecondaryPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    WhatsAppNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Area = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    HomeVisitMessage = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    OpeningHours = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    BookingNotice = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    LocalServiceRadiusKm = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysutcdatetime())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ShopBusi__DD59F52AABD9A9E9", x => x.ShopBusinessSettingId);
                });

            migrationBuilder.CreateTable(
                name: "Announcements",
                columns: table => new
                {
                    AnnouncementId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    AnnouncementType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Audience = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DisplayLocation = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ButtonText = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    ButtonLink = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    StartAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    EndAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    Priority = table.Column<int>(type: "int", nullable: false, defaultValue: 2),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    ShowOnce = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedByAppUserId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Announce__9DE44574EC2120EF", x => x.AnnouncementId);
                    table.ForeignKey(
                        name: "FK__Announcem__Creat__37703C52",
                        column: x => x.CreatedByAppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId");
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    AuditLogId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AppUserId = table.Column<int>(type: "int", nullable: true),
                    Action = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EntityName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EntityId = table.Column<int>(type: "int", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__AuditLog__EB5F6CBDA7ADE757", x => x.AuditLogId);
                    table.ForeignKey(
                        name: "FK_AuditLogs_AppUsers",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId");
                });

            migrationBuilder.CreateTable(
                name: "Customers",
                columns: table => new
                {
                    CustomerId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AppUserId = table.Column<int>(type: "int", nullable: true),
                    FullName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Customer__A4AE64D8030B87BC", x => x.CustomerId);
                    table.ForeignKey(
                        name: "FK__Customers__AppUs__44FF419A",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId");
                });

            migrationBuilder.CreateTable(
                name: "ExternalLogins",
                columns: table => new
                {
                    ExternalLoginId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AppUserId = table.Column<int>(type: "int", nullable: false),
                    Provider = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ProviderUserId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysutcdatetime())")
                        .Annotation("Relational:DefaultConstraintName", "DF_ExternalLogins_CreatedAt")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__External__A8FDB3AEFF7E58AD", x => x.ExternalLoginId);
                    table.ForeignKey(
                        name: "FK_ExternalLogins_AppUsers",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId");
                });

            migrationBuilder.CreateTable(
                name: "OtpCodes",
                columns: table => new
                {
                    OtpCodeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AppUserId = table.Column<int>(type: "int", nullable: true),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    NormalizedEmail = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Purpose = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CodeHash = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ConsumedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AttemptCount = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysutcdatetime())")
                        .Annotation("Relational:DefaultConstraintName", "DF_OtpCodes_CreatedAt"),
                    CreatedByIp = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__OtpCodes__A67C33971CBB5268", x => x.OtpCodeId);
                    table.ForeignKey(
                        name: "FK_OtpCodes_AppUsers",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId");
                });

            migrationBuilder.CreateTable(
                name: "PasswordResetSessions",
                columns: table => new
                {
                    PasswordResetSessionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AppUserId = table.Column<int>(type: "int", nullable: false),
                    TokenHash = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ConsumedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysutcdatetime())")
                        .Annotation("Relational:DefaultConstraintName", "DF_PasswordResetSessions_CreatedAt"),
                    CreatedByIp = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Password__6F719DD56034C09F", x => x.PasswordResetSessionId);
                    table.ForeignKey(
                        name: "FK_PasswordResetSessions_AppUsers",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId");
                });

            migrationBuilder.CreateTable(
                name: "UserAuthEvents",
                columns: table => new
                {
                    UserAuthEventId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AppUserId = table.Column<int>(type: "int", nullable: true),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    EventType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Success = table.Column<bool>(type: "bit", nullable: false),
                    IpAddress = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysutcdatetime())")
                        .Annotation("Relational:DefaultConstraintName", "DF_UserAuthEvents_CreatedAt")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__UserAuth__B4D04386A20A8D24", x => x.UserAuthEventId);
                    table.ForeignKey(
                        name: "FK_UserAuthEvents_AppUsers",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId");
                });

            migrationBuilder.CreateTable(
                name: "UserSessions",
                columns: table => new
                {
                    UserSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newsequentialid())")
                        .Annotation("Relational:DefaultConstraintName", "DF_UserSessions_UserSessionId"),
                    AppUserId = table.Column<int>(type: "int", nullable: false),
                    DeviceType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    DeviceName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    BrowserName = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    BrowserVersion = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    OperatingSystem = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    UserAgent = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysutcdatetime())")
                        .Annotation("Relational:DefaultConstraintName", "DF_UserSessions_CreatedAt"),
                    LastSeenAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysutcdatetime())")
                        .Annotation("Relational:DefaultConstraintName", "DF_UserSessions_LastSeenAt"),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RevokedByIp = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSessions", x => x.UserSessionId);
                    table.ForeignKey(
                        name: "FK_UserSessions_AppUsers",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId");
                });

            migrationBuilder.CreateTable(
                name: "WebsiteVisits",
                columns: table => new
                {
                    WebsiteVisitId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VisitorId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AppUserId = table.Column<int>(type: "int", nullable: true),
                    Path = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Referrer = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysutcdatetime())")
                        .Annotation("Relational:DefaultConstraintName", "DF_WebsiteVisits_CreatedAt")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__WebsiteV__BFC387B4AC38460C", x => x.WebsiteVisitId);
                    table.ForeignKey(
                        name: "FK_WebsiteVisits_AppUsers",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId");
                });

            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    ProductId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductCategoryId = table.Column<int>(type: "int", nullable: false),
                    ProductConditionId = table.Column<int>(type: "int", nullable: false),
                    ProductName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Brand = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ModelName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Price = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    StockQuantity = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    IsAvailable = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    IsFeatured = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PrimaryImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Products__B40CC6CD13B5D931", x => x.ProductId);
                    table.ForeignKey(
                        name: "FK__Products__Produc__76969D2E",
                        column: x => x.ProductCategoryId,
                        principalTable: "ProductCategories",
                        principalColumn: "ProductCategoryId");
                    table.ForeignKey(
                        name: "FK__Products__Produc__778AC167",
                        column: x => x.ProductConditionId,
                        principalTable: "ProductConditions",
                        principalColumn: "ProductConditionId");
                });

            migrationBuilder.CreateTable(
                name: "AppUserRoles",
                columns: table => new
                {
                    AppUserId = table.Column<int>(type: "int", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("Pk_AppUserRoles", x => new { x.AppUserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AppUserRoles_AppUsers",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId");
                    table.ForeignKey(
                        name: "FK_AppUserRoles_Roles",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "RoleId");
                });

            migrationBuilder.CreateTable(
                name: "AnnouncementViews",
                columns: table => new
                {
                    AnnouncementViewId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AnnouncementId = table.Column<int>(type: "int", nullable: false),
                    AppUserId = table.Column<int>(type: "int", nullable: false),
                    ViewedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())")
                        .Annotation("Relational:DefaultConstraintName", "DF_AnnouncementViews_ViewedAt")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Announce__78F9B23903576BC6", x => x.AnnouncementViewId);
                    table.ForeignKey(
                        name: "FK_AnnouncementViews_Announcements",
                        column: x => x.AnnouncementId,
                        principalTable: "Announcements",
                        principalColumn: "AnnouncementId");
                    table.ForeignKey(
                        name: "FK_AnnouncementViews_AppUsers",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId");
                });

            migrationBuilder.CreateTable(
                name: "CustomerAddresses",
                columns: table => new
                {
                    CustomerAddressId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CustomerId = table.Column<int>(type: "int", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    AddressLine = table.Column<string>(type: "nvarchar(350)", maxLength: 350, nullable: false),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    State = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Pincode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsDefault = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Customer__DB891B78D0F6C3B8", x => x.CustomerAddressId);
                    table.ForeignKey(
                        name: "FK__CustomerA__Custo__49C3F6B7",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "CustomerId");
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    RefreshTokenId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AppUserId = table.Column<int>(type: "int", nullable: false),
                    TokenHash = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysutcdatetime())")
                        .Annotation("Relational:DefaultConstraintName", "DF_RefreshTokens_CreatedAt"),
                    CreatedByIp = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RevokedByIp = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ReplacedByTokenHash = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    UserSessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__RefreshT__F5845E3949FF50F0", x => x.RefreshTokenId);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_AppUsers",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId");
                    table.ForeignKey(
                        name: "FK_RefreshTokens_UserSessions",
                        column: x => x.UserSessionId,
                        principalTable: "UserSessions",
                        principalColumn: "UserSessionId");
                });

            migrationBuilder.CreateTable(
                name: "ProductImages",
                columns: table => new
                {
                    ProductImageId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    AltText = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    IsPrimary = table.Column<bool>(type: "bit", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ProductI__07B2B1B8FCA372B4", x => x.ProductImageId);
                    table.ForeignKey(
                        name: "FK__ProductIm__Produ__00200768",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "ProductId");
                });

            migrationBuilder.CreateTable(
                name: "ServiceRequests",
                columns: table => new
                {
                    ServiceRequestId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequestNumber = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CustomerId = table.Column<int>(type: "int", nullable: true),
                    CustomerAddressId = table.Column<int>(type: "int", nullable: true),
                    CustomerName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    ServiceCategoryId = table.Column<int>(type: "int", nullable: false),
                    DeviceName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    Brand = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ModelName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    IssueDescription = table.Column<string>(type: "nvarchar(800)", maxLength: 800, nullable: false),
                    ServiceType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Home Visit"),
                    VisitAddress = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    PreferredDate = table.Column<DateOnly>(type: "date", nullable: true),
                    PreferredTimeSlot = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    CurrentStatusId = table.Column<int>(type: "int", nullable: false),
                    EstimatedPrice = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    FinalPrice = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    AdminNotes = table.Column<string>(type: "nvarchar(800)", maxLength: 800, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ServiceLocationId = table.Column<int>(type: "int", nullable: true),
                    PaymentStatus = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "Pending")
                        .Annotation("Relational:DefaultConstraintName", "DF_ServiceRequests_PaymentStatus"),
                    PaidAt = table.Column<DateTime>(type: "datetime", nullable: true),
                    Diagnosis = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    WorkNotes = table.Column<string>(type: "nvarchar(1500)", maxLength: 1500, nullable: true),
                    PartsUsed = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ShowRepairNotesToCustomer = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    WarrantyNote = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ServiceR__790F6C8BB4A882F8", x => x.ServiceRequestId);
                    table.ForeignKey(
                        name: "FK__ServiceRe__Curre__5DCAEF64",
                        column: x => x.CurrentStatusId,
                        principalTable: "ServiceStatus",
                        principalColumn: "ServiceStatusId");
                    table.ForeignKey(
                        name: "FK__ServiceRe__Custo__59063A47",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "CustomerId");
                    table.ForeignKey(
                        name: "FK__ServiceRe__Custo__59FA5E80",
                        column: x => x.CustomerAddressId,
                        principalTable: "CustomerAddresses",
                        principalColumn: "CustomerAddressId");
                    table.ForeignKey(
                        name: "FK__ServiceRe__Servi__151B244E",
                        column: x => x.ServiceLocationId,
                        principalTable: "ServiceLocations",
                        principalColumn: "ServiceLocationId");
                    table.ForeignKey(
                        name: "FK__ServiceRe__Servi__5AEE82B9",
                        column: x => x.ServiceCategoryId,
                        principalTable: "ServiceCategories",
                        principalColumn: "ServiceCategoryId");
                });

            migrationBuilder.CreateTable(
                name: "CustomerNotifications",
                columns: table => new
                {
                    CustomerNotificationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CustomerId = table.Column<int>(type: "int", nullable: false),
                    ServiceRequestId = table.Column<int>(type: "int", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())")
                        .Annotation("Relational:DefaultConstraintName", "DF_CustomerNotifications_CreatedAt")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Customer__9E9BDBE6B5DE7B24", x => x.CustomerNotificationId);
                    table.ForeignKey(
                        name: "FK__CustomerN__Custo__1CBC4616",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "CustomerId");
                    table.ForeignKey(
                        name: "FK__CustomerN__Servi__1DB06A4F",
                        column: x => x.ServiceRequestId,
                        principalTable: "ServiceRequests",
                        principalColumn: "ServiceRequestId");
                });

            migrationBuilder.CreateTable(
                name: "CustomerRepairFeedbacks",
                columns: table => new
                {
                    CustomerRepairFeedbackId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServiceRequestId = table.Column<int>(type: "int", nullable: false),
                    CustomerId = table.Column<int>(type: "int", nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IsPublic = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Customer__6EBABC2110BB70E2", x => x.CustomerRepairFeedbackId);
                    table.ForeignKey(
                        name: "FK__CustomerR__Custo__2EDAF651",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "CustomerId");
                    table.ForeignKey(
                        name: "FK__CustomerR__Servi__2DE6D218",
                        column: x => x.ServiceRequestId,
                        principalTable: "ServiceRequests",
                        principalColumn: "ServiceRequestId");
                });

            migrationBuilder.CreateTable(
                name: "Enquiries",
                columns: table => new
                {
                    EnquiryId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CustomerId = table.Column<int>(type: "int", nullable: true),
                    ProductId = table.Column<int>(type: "int", nullable: true),
                    ServiceRequestId = table.Column<int>(type: "int", nullable: true),
                    FullName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Subject = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Message = table.Column<string>(type: "nvarchar(800)", maxLength: 800, nullable: false),
                    EnquiryStatusId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Enquirie__0A019B7DCAA5B70E", x => x.EnquiryId);
                    table.ForeignKey(
                        name: "FK__Enquiries__Custo__09A971A2",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "CustomerId");
                    table.ForeignKey(
                        name: "FK__Enquiries__Enqui__0C85DE4D",
                        column: x => x.EnquiryStatusId,
                        principalTable: "EnquiryStatuses",
                        principalColumn: "EnquiryStatusId");
                    table.ForeignKey(
                        name: "FK__Enquiries__Produ__0A9D95DB",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "ProductId");
                    table.ForeignKey(
                        name: "FK__Enquiries__Servi__0B91BA14",
                        column: x => x.ServiceRequestId,
                        principalTable: "ServiceRequests",
                        principalColumn: "ServiceRequestId");
                });

            migrationBuilder.CreateTable(
                name: "ServiceAssignments",
                columns: table => new
                {
                    ServiceAssignmentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServiceRequestId = table.Column<int>(type: "int", nullable: false),
                    AssignedToAppUserId = table.Column<int>(type: "int", nullable: false),
                    AssignedByAppUserId = table.Column<int>(type: "int", nullable: true),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())"),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ServiceA__F283B6103747A3F1", x => x.ServiceAssignmentId);
                    table.ForeignKey(
                        name: "FK__ServiceAs__Assig__693CA210",
                        column: x => x.AssignedToAppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId");
                    table.ForeignKey(
                        name: "FK__ServiceAs__Assig__6A30C649",
                        column: x => x.AssignedByAppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId");
                    table.ForeignKey(
                        name: "FK__ServiceAs__Servi__68487DD7",
                        column: x => x.ServiceRequestId,
                        principalTable: "ServiceRequests",
                        principalColumn: "ServiceRequestId");
                });

            migrationBuilder.CreateTable(
                name: "ServiceRequestImages",
                columns: table => new
                {
                    ServiceRequestImageId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServiceRequestId = table.Column<int>(type: "int", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    OriginalFileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysutcdatetime())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ServiceR__DFB13AEB11646E3B", x => x.ServiceRequestImageId);
                    table.ForeignKey(
                        name: "FK_ServiceRequestImages_ServiceRequests",
                        column: x => x.ServiceRequestId,
                        principalTable: "ServiceRequests",
                        principalColumn: "ServiceRequestId");
                });

            migrationBuilder.CreateTable(
                name: "ServiceRequestStatusHistory",
                columns: table => new
                {
                    StatusHistoryId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServiceRequestId = table.Column<int>(type: "int", nullable: false),
                    OldStatusId = table.Column<int>(type: "int", nullable: true),
                    NewStatusId = table.Column<int>(type: "int", nullable: false),
                    ChangedByAppUserId = table.Column<int>(type: "int", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ChangedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__ServiceR__DB973491C71B373D", x => x.StatusHistoryId);
                    table.ForeignKey(
                        name: "FK__ServiceRe__Chang__6477ECF3",
                        column: x => x.ChangedByAppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "AppUserId");
                    table.ForeignKey(
                        name: "FK__ServiceRe__NewSt__6383C8BA",
                        column: x => x.NewStatusId,
                        principalTable: "ServiceStatus",
                        principalColumn: "ServiceStatusId");
                    table.ForeignKey(
                        name: "FK__ServiceRe__OldSt__628FA481",
                        column: x => x.OldStatusId,
                        principalTable: "ServiceStatus",
                        principalColumn: "ServiceStatusId");
                    table.ForeignKey(
                        name: "FK__ServiceRe__Servi__619B8048",
                        column: x => x.ServiceRequestId,
                        principalTable: "ServiceRequests",
                        principalColumn: "ServiceRequestId");
                });

            migrationBuilder.CreateTable(
                name: "AdminNotifications",
                columns: table => new
                {
                    AdminNotificationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServiceRequestId = table.Column<int>(type: "int", nullable: true),
                    EnquiryId = table.Column<int>(type: "int", nullable: true),
                    ProductId = table.Column<int>(type: "int", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    NotificationType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__AdminNot__EC88D08D900CDBC8", x => x.AdminNotificationId);
                    table.ForeignKey(
                        name: "FK__AdminNoti__Enqui__236943A5",
                        column: x => x.EnquiryId,
                        principalTable: "Enquiries",
                        principalColumn: "EnquiryId");
                    table.ForeignKey(
                        name: "FK__AdminNoti__Produ__245D67DE",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "ProductId");
                    table.ForeignKey(
                        name: "FK__AdminNoti__Servi__22751F6C",
                        column: x => x.ServiceRequestId,
                        principalTable: "ServiceRequests",
                        principalColumn: "ServiceRequestId");
                });

            migrationBuilder.CreateTable(
                name: "EnquiryNotes",
                columns: table => new
                {
                    EnquiryNoteId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EnquiryId = table.Column<int>(type: "int", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "(getdate())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__EnquiryN__E6661A582F19D39A", x => x.EnquiryNoteId);
                    table.ForeignKey(
                        name: "FK__EnquiryNo__Enqui__29221CFB",
                        column: x => x.EnquiryId,
                        principalTable: "Enquiries",
                        principalColumn: "EnquiryId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdminNotifications_EnquiryId",
                table: "AdminNotifications",
                column: "EnquiryId");

            migrationBuilder.CreateIndex(
                name: "IX_AdminNotifications_ProductId",
                table: "AdminNotifications",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_AdminNotifications_ServiceRequestId",
                table: "AdminNotifications",
                column: "ServiceRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_CreatedByAppUserId",
                table: "Announcements",
                column: "CreatedByAppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementViews_AppUserId",
                table: "AnnouncementViews",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "UQ_AnnouncementViews_Announcement_User",
                table: "AnnouncementViews",
                columns: new[] { "AnnouncementId", "AppUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppUserRoles_RoleId",
                table: "AppUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_ClerkUserId",
                table: "AppUsers",
                column: "ClerkUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_Email",
                table: "AppUsers",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "UX_AppUsers_ClerkUserId_NotNull",
                table: "AppUsers",
                column: "ClerkUserId",
                unique: true,
                filter: "([ClerkUserId] IS NOT NULL)");

            migrationBuilder.CreateIndex(
                name: "UX_AppUsers_NormalizedEmail_Active",
                table: "AppUsers",
                column: "NormalizedEmail",
                unique: true,
                filter: "([DeletedAt] IS NULL)");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_AppUserId_CreatedAt",
                table: "AuditLogs",
                columns: new[] { "AppUserId", "CreatedAt" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_CreatedAt",
                table: "AuditLogs",
                column: "CreatedAt",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Entity_CreatedAt",
                table: "AuditLogs",
                columns: new[] { "EntityName", "EntityId", "CreatedAt" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "IX_CustomerAddresses_CustomerId",
                table: "CustomerAddresses",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerNotifications_CustomerId",
                table: "CustomerNotifications",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerNotifications_ServiceRequestId",
                table: "CustomerNotifications",
                column: "ServiceRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerRepairFeedbacks_CustomerId",
                table: "CustomerRepairFeedbacks",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "UX_CustomerRepairFeedbacks_ServiceRequest_Customer",
                table: "CustomerRepairFeedbacks",
                columns: new[] { "ServiceRequestId", "CustomerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_Customers_AppUserId",
                table: "Customers",
                column: "AppUserId",
                unique: true,
                filter: "([AppUserId] IS NOT NULL)");

            migrationBuilder.CreateIndex(
                name: "UX_Customers_PhoneNumber",
                table: "Customers",
                column: "PhoneNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Enquiries_CustomerId",
                table: "Enquiries",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Enquiries_EnquiryStatusId",
                table: "Enquiries",
                column: "EnquiryStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_Enquiries_ProductId",
                table: "Enquiries",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Enquiries_ServiceRequestId",
                table: "Enquiries",
                column: "ServiceRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_EnquiryNotes_EnquiryId",
                table: "EnquiryNotes",
                column: "EnquiryId");

            migrationBuilder.CreateIndex(
                name: "UQ__EnquiryS__05E7698A03F9A8EC",
                table: "EnquiryStatuses",
                column: "StatusName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ExternalLogins_AppUserId",
                table: "ExternalLogins",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "UX_ExternalLogins_Provider_ProviderUserId",
                table: "ExternalLogins",
                columns: new[] { "Provider", "ProviderUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OtpCodes_AppUserId",
                table: "OtpCodes",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_OtpCodes_ExpiresAt",
                table: "OtpCodes",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_OtpCodes_NormalizedEmail_Purpose",
                table: "OtpCodes",
                columns: new[] { "NormalizedEmail", "Purpose", "CreatedAt" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetSessions_AppUserId",
                table: "PasswordResetSessions",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "UX_PasswordResetSessions_TokenHash",
                table: "PasswordResetSessions",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__ProductC__8517B2E0EA0DC3E1",
                table: "ProductCategories",
                column: "CategoryName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__ProductC__CE7E606616D3651C",
                table: "ProductConditions",
                column: "ConditionName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductImages_ProductId",
                table: "ProductImages",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_IsAvailable",
                table: "Products",
                column: "IsAvailable");

            migrationBuilder.CreateIndex(
                name: "IX_Products_IsFeatured",
                table: "Products",
                column: "IsFeatured");

            migrationBuilder.CreateIndex(
                name: "IX_Products_ProductCategoryId",
                table: "Products",
                column: "ProductCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_ProductConditionId",
                table: "Products",
                column: "ProductConditionId");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_AppUserId",
                table: "RefreshTokens",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_ExpiresAt",
                table: "RefreshTokens",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserSessionId",
                table: "RefreshTokens",
                column: "UserSessionId");

            migrationBuilder.CreateIndex(
                name: "UX_RefreshTokens_TokenHash",
                table: "RefreshTokens",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__Roles__8A2B61603E360396",
                table: "Roles",
                column: "RoleName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceAssignments_AssignedByAppUserId",
                table: "ServiceAssignments",
                column: "AssignedByAppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceAssignments_AssignedToAppUserId",
                table: "ServiceAssignments",
                column: "AssignedToAppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceAssignments_ServiceRequestId",
                table: "ServiceAssignments",
                column: "ServiceRequestId");

            migrationBuilder.CreateIndex(
                name: "UQ__ServiceC__8517B2E0501C19A7",
                table: "ServiceCategories",
                column: "CategoryName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequestImages_ServiceRequestId",
                table: "ServiceRequestImages",
                column: "ServiceRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequests_CreatedAt",
                table: "ServiceRequests",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequests_CurrentStatusId",
                table: "ServiceRequests",
                column: "CurrentStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequests_CustomerAddressId",
                table: "ServiceRequests",
                column: "CustomerAddressId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequests_CustomerId",
                table: "ServiceRequests",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequests_PhoneNumber",
                table: "ServiceRequests",
                column: "PhoneNumber");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequests_RequestNumber",
                table: "ServiceRequests",
                column: "RequestNumber");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequests_ServiceCategoryId",
                table: "ServiceRequests",
                column: "ServiceCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequests_ServiceLocationId",
                table: "ServiceRequests",
                column: "ServiceLocationId");

            migrationBuilder.CreateIndex(
                name: "UQ__ServiceR__9ADA6BE0535B494D",
                table: "ServiceRequests",
                column: "RequestNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequestStatusHistory_ChangedByAppUserId",
                table: "ServiceRequestStatusHistory",
                column: "ChangedByAppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequestStatusHistory_NewStatusId",
                table: "ServiceRequestStatusHistory",
                column: "NewStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequestStatusHistory_OldStatusId",
                table: "ServiceRequestStatusHistory",
                column: "OldStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequestStatusHistory_ServiceRequestId",
                table: "ServiceRequestStatusHistory",
                column: "ServiceRequestId");

            migrationBuilder.CreateIndex(
                name: "UQ__ServiceS__05E7698AC4AEA66D",
                table: "ServiceStatus",
                column: "StatusName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserAuthEvents_AppUserId_CreatedAt",
                table: "UserAuthEvents",
                columns: new[] { "AppUserId", "CreatedAt" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_UserAuthEvents_Email_CreatedAt",
                table: "UserAuthEvents",
                columns: new[] { "Email", "CreatedAt" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_UserAuthEvents_EventType_CreatedAt",
                table: "UserAuthEvents",
                columns: new[] { "EventType", "CreatedAt" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_AppUserId_RevokedAt",
                table: "UserSessions",
                columns: new[] { "AppUserId", "RevokedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_LastSeenAt",
                table: "UserSessions",
                column: "LastSeenAt");

            migrationBuilder.CreateIndex(
                name: "IX_WebsiteVisits_AppUserId_CreatedAt",
                table: "WebsiteVisits",
                columns: new[] { "AppUserId", "CreatedAt" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_WebsiteVisits_CreatedAt",
                table: "WebsiteVisits",
                column: "CreatedAt",
                descending: new bool[0]);

            migrationBuilder.CreateIndex(
                name: "IX_WebsiteVisits_Path_CreatedAt",
                table: "WebsiteVisits",
                columns: new[] { "Path", "CreatedAt" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_WebsiteVisits_VisitorId_CreatedAt",
                table: "WebsiteVisits",
                columns: new[] { "VisitorId", "CreatedAt" },
                descending: new[] { false, true });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdminNotifications");

            migrationBuilder.DropTable(
                name: "AnnouncementViews");

            migrationBuilder.DropTable(
                name: "AppUserRoles");

            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "CustomerNotifications");

            migrationBuilder.DropTable(
                name: "CustomerRepairFeedbacks");

            migrationBuilder.DropTable(
                name: "EnquiryNotes");

            migrationBuilder.DropTable(
                name: "ExternalLogins");

            migrationBuilder.DropTable(
                name: "OtpCodes");

            migrationBuilder.DropTable(
                name: "PasswordResetSessions");

            migrationBuilder.DropTable(
                name: "ProductImages");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "ServiceAssignments");

            migrationBuilder.DropTable(
                name: "ServiceRequestImages");

            migrationBuilder.DropTable(
                name: "ServiceRequestStatusHistory");

            migrationBuilder.DropTable(
                name: "ShopBusinessSettings");

            migrationBuilder.DropTable(
                name: "UserAuthEvents");

            migrationBuilder.DropTable(
                name: "WebsiteVisits");

            migrationBuilder.DropTable(
                name: "Announcements");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "Enquiries");

            migrationBuilder.DropTable(
                name: "UserSessions");

            migrationBuilder.DropTable(
                name: "EnquiryStatuses");

            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropTable(
                name: "ServiceRequests");

            migrationBuilder.DropTable(
                name: "ProductCategories");

            migrationBuilder.DropTable(
                name: "ProductConditions");

            migrationBuilder.DropTable(
                name: "ServiceStatus");

            migrationBuilder.DropTable(
                name: "CustomerAddresses");

            migrationBuilder.DropTable(
                name: "ServiceLocations");

            migrationBuilder.DropTable(
                name: "ServiceCategories");

            migrationBuilder.DropTable(
                name: "Customers");

            migrationBuilder.DropTable(
                name: "AppUsers");
        }
    }
}
