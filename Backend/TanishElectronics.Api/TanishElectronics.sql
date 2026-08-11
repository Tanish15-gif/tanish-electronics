IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [AppUsers] (
    [AppUserId] int NOT NULL IDENTITY,
    [ClerkUserId] nvarchar(150) NULL,
    [FullName] nvarchar(120) NOT NULL,
    [Email] nvarchar(150) NOT NULL,
    [PhoneNumber] nvarchar(20) NULL,
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    [CreatedAt] datetime2 NOT NULL DEFAULT ((getdate())),
    [UpdatedAt] datetime2 NULL,
    [DeletedAt] datetime2 NULL,
    [PasswordHash] nvarchar(500) NULL,
    [NormalizedEmail] nvarchar(150) NULL,
    [EmailConfirmed] bit NOT NULL,
    [LastLoginAt] datetime2 NULL,
    [LastSeenAt] datetime2 NULL,
    [LastLogoutAt] datetime2 NULL,
    [AccessFailedCount] int NOT NULL,
    [LockoutEndAt] datetime2 NULL,
    [PasswordUpdatedAt] datetime2 NULL,
    [ProfileImageUrl] nvarchar(2048) NULL,
    [ProfileImageSource] nvarchar(30) NULL,
    [ProfileImageUpdatedAt] datetime2 NULL,
    CONSTRAINT [PK__AppUsers__FC65C73016001A02] PRIMARY KEY ([AppUserId])
);

CREATE TABLE [EnquiryStatuses] (
    [EnquiryStatusId] int NOT NULL IDENTITY,
    [StatusName] nvarchar(50) NOT NULL,
    [SortOrder] int NOT NULL,
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    CONSTRAINT [PK__EnquiryS__C8FB76E203611CE3] PRIMARY KEY ([EnquiryStatusId])
);

CREATE TABLE [ProductCategories] (
    [ProductCategoryId] int NOT NULL IDENTITY,
    [CategoryName] nvarchar(100) NOT NULL,
    [Description] nvarchar(300) NULL,
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    [CreatedAt] datetime2 NOT NULL DEFAULT ((getdate())),
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK__ProductC__3224ECCE5A079966] PRIMARY KEY ([ProductCategoryId])
);

CREATE TABLE [ProductConditions] (
    [ProductConditionId] int NOT NULL IDENTITY,
    [ConditionName] nvarchar(50) NOT NULL,
    [Description] nvarchar(250) NULL,
    CONSTRAINT [PK__ProductC__D6ABB173646A7755] PRIMARY KEY ([ProductConditionId])
);

CREATE TABLE [Roles] (
    [RoleId] int NOT NULL IDENTITY,
    [RoleName] nvarchar(50) NOT NULL,
    [Description] nvarchar(100) NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT ((getdate())),
    CONSTRAINT [PK__Roles__8AFACE1A9C878CA8] PRIMARY KEY ([RoleId])
);

CREATE TABLE [ServiceCategories] (
    [ServiceCategoryId] int NOT NULL IDENTITY,
    [CategoryName] nvarchar(100) NOT NULL,
    [Description] nvarchar(300) NULL,
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    [CreatedAt] datetime2 NOT NULL DEFAULT ((getdate())),
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK__ServiceC__E4CC7EAA8FB47EA1] PRIMARY KEY ([ServiceCategoryId])
);

CREATE TABLE [ServiceLocations] (
    [ServiceLocationId] int NOT NULL IDENTITY,
    [LocationName] nvarchar(120) NOT NULL,
    [City] nvarchar(100) NOT NULL DEFAULT N'Mumbai',
    [PinCode] nvarchar(20) NULL,
    [IsHomeVisitAvailable] bit NOT NULL DEFAULT CAST(1 AS bit),
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    [CreatedAt] datetime2 NOT NULL DEFAULT ((getdate())),
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK__ServiceL__8CC619AC581EADC8] PRIMARY KEY ([ServiceLocationId])
);

CREATE TABLE [ServiceStatus] (
    [ServiceStatusId] int NOT NULL IDENTITY,
    [StatusName] nvarchar(50) NOT NULL,
    [SortOrder] int NOT NULL,
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    CONSTRAINT [PK__ServiceS__009D5ED9C9007FDA] PRIMARY KEY ([ServiceStatusId])
);

CREATE TABLE [ShopBusinessSettings] (
    [ShopBusinessSettingId] int NOT NULL IDENTITY,
    [ShopName] nvarchar(150) NOT NULL,
    [OwnerName] nvarchar(150) NOT NULL,
    [PrimaryPhone] nvarchar(20) NOT NULL,
    [SecondaryPhone] nvarchar(20) NOT NULL,
    [WhatsAppNumber] nvarchar(20) NOT NULL,
    [Email] nvarchar(150) NULL,
    [Address] nvarchar(500) NOT NULL,
    [City] nvarchar(100) NOT NULL,
    [Area] nvarchar(100) NOT NULL,
    [HomeVisitMessage] nvarchar(500) NOT NULL,
    [OpeningHours] nvarchar(200) NOT NULL,
    [BookingNotice] nvarchar(500) NOT NULL,
    [LocalServiceRadiusKm] int NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT ((sysutcdatetime())),
    CONSTRAINT [PK__ShopBusi__DD59F52AABD9A9E9] PRIMARY KEY ([ShopBusinessSettingId])
);

CREATE TABLE [Announcements] (
    [AnnouncementId] int NOT NULL IDENTITY,
    [Title] nvarchar(150) NOT NULL,
    [Message] nvarchar(1000) NOT NULL,
    [AnnouncementType] nvarchar(50) NOT NULL,
    [Audience] nvarchar(50) NOT NULL,
    [DisplayLocation] nvarchar(50) NOT NULL,
    [ImageUrl] nvarchar(1000) NULL,
    [ButtonText] nvarchar(80) NULL,
    [ButtonLink] nvarchar(500) NULL,
    [StartAt] datetime NULL,
    [EndAt] datetime NULL,
    [Priority] int NOT NULL DEFAULT 2,
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    [ShowOnce] bit NOT NULL DEFAULT CAST(1 AS bit),
    [CreatedByAppUserId] int NULL,
    [CreatedAt] datetime NOT NULL DEFAULT ((getdate())),
    [UpdatedAt] datetime NULL,
    [DeletedAt] datetime NULL,
    CONSTRAINT [PK__Announce__9DE44574EC2120EF] PRIMARY KEY ([AnnouncementId]),
    CONSTRAINT [FK__Announcem__Creat__37703C52] FOREIGN KEY ([CreatedByAppUserId]) REFERENCES [AppUsers] ([AppUserId])
);

CREATE TABLE [AuditLogs] (
    [AuditLogId] int NOT NULL IDENTITY,
    [AppUserId] int NULL,
    [Action] nvarchar(100) NOT NULL,
    [EntityName] nvarchar(100) NOT NULL,
    [EntityId] int NULL,
    [Description] nvarchar(1000) NULL,
    [IpAddress] nvarchar(100) NULL,
    [UserAgent] nvarchar(500) NULL,
    [CreatedAt] datetime NOT NULL DEFAULT ((getdate())),
    CONSTRAINT [PK__AuditLog__EB5F6CBDA7ADE757] PRIMARY KEY ([AuditLogId]),
    CONSTRAINT [FK_AuditLogs_AppUsers] FOREIGN KEY ([AppUserId]) REFERENCES [AppUsers] ([AppUserId])
);

CREATE TABLE [Customers] (
    [CustomerId] int NOT NULL IDENTITY,
    [AppUserId] int NULL,
    [FullName] nvarchar(120) NOT NULL,
    [PhoneNumber] nvarchar(20) NOT NULL,
    [Email] nvarchar(150) NULL,
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    [CreatedAt] datetime2 NOT NULL DEFAULT ((getdate())),
    [UpdatedAt] datetime2 NULL,
    [DeletedAt] datetime2 NULL,
    CONSTRAINT [PK__Customer__A4AE64D8030B87BC] PRIMARY KEY ([CustomerId]),
    CONSTRAINT [FK__Customers__AppUs__44FF419A] FOREIGN KEY ([AppUserId]) REFERENCES [AppUsers] ([AppUserId])
);

CREATE TABLE [ExternalLogins] (
    [ExternalLoginId] int NOT NULL IDENTITY,
    [AppUserId] int NOT NULL,
    [Provider] nvarchar(50) NOT NULL,
    [ProviderUserId] nvarchar(200) NOT NULL,
    [Email] nvarchar(150) NULL,
    [CreatedAt] datetime2 NOT NULL CONSTRAINT [DF_ExternalLogins_CreatedAt] DEFAULT ((sysutcdatetime())),
    CONSTRAINT [PK__External__A8FDB3AEFF7E58AD] PRIMARY KEY ([ExternalLoginId]),
    CONSTRAINT [FK_ExternalLogins_AppUsers] FOREIGN KEY ([AppUserId]) REFERENCES [AppUsers] ([AppUserId])
);

CREATE TABLE [OtpCodes] (
    [OtpCodeId] int NOT NULL IDENTITY,
    [AppUserId] int NULL,
    [Email] nvarchar(150) NOT NULL,
    [NormalizedEmail] nvarchar(150) NOT NULL,
    [Purpose] nvarchar(50) NOT NULL,
    [CodeHash] nvarchar(256) NOT NULL,
    [ExpiresAt] datetime2 NOT NULL,
    [ConsumedAt] datetime2 NULL,
    [AttemptCount] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL CONSTRAINT [DF_OtpCodes_CreatedAt] DEFAULT ((sysutcdatetime())),
    [CreatedByIp] nvarchar(100) NULL,
    CONSTRAINT [PK__OtpCodes__A67C33971CBB5268] PRIMARY KEY ([OtpCodeId]),
    CONSTRAINT [FK_OtpCodes_AppUsers] FOREIGN KEY ([AppUserId]) REFERENCES [AppUsers] ([AppUserId])
);

CREATE TABLE [PasswordResetSessions] (
    [PasswordResetSessionId] int NOT NULL IDENTITY,
    [AppUserId] int NOT NULL,
    [TokenHash] nvarchar(200) NOT NULL,
    [ExpiresAt] datetime2 NOT NULL,
    [ConsumedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL CONSTRAINT [DF_PasswordResetSessions_CreatedAt] DEFAULT ((sysutcdatetime())),
    [CreatedByIp] nvarchar(64) NULL,
    CONSTRAINT [PK__Password__6F719DD56034C09F] PRIMARY KEY ([PasswordResetSessionId]),
    CONSTRAINT [FK_PasswordResetSessions_AppUsers] FOREIGN KEY ([AppUserId]) REFERENCES [AppUsers] ([AppUserId])
);

CREATE TABLE [UserAuthEvents] (
    [UserAuthEventId] int NOT NULL IDENTITY,
    [AppUserId] int NULL,
    [Email] nvarchar(150) NULL,
    [EventType] nvarchar(100) NOT NULL,
    [Success] bit NOT NULL,
    [IpAddress] nvarchar(100) NULL,
    [UserAgent] nvarchar(500) NULL,
    [Description] nvarchar(1000) NULL,
    [CreatedAt] datetime2 NOT NULL CONSTRAINT [DF_UserAuthEvents_CreatedAt] DEFAULT ((sysutcdatetime())),
    CONSTRAINT [PK__UserAuth__B4D04386A20A8D24] PRIMARY KEY ([UserAuthEventId]),
    CONSTRAINT [FK_UserAuthEvents_AppUsers] FOREIGN KEY ([AppUserId]) REFERENCES [AppUsers] ([AppUserId])
);

CREATE TABLE [UserSessions] (
    [UserSessionId] uniqueidentifier NOT NULL CONSTRAINT [DF_UserSessions_UserSessionId] DEFAULT ((newsequentialid())),
    [AppUserId] int NOT NULL,
    [DeviceType] nvarchar(30) NOT NULL,
    [DeviceName] nvarchar(100) NOT NULL,
    [BrowserName] nvarchar(60) NOT NULL,
    [BrowserVersion] nvarchar(40) NULL,
    [OperatingSystem] nvarchar(80) NOT NULL,
    [UserAgent] nvarchar(1000) NULL,
    [IpAddress] nvarchar(64) NULL,
    [CreatedAt] datetime2 NOT NULL CONSTRAINT [DF_UserSessions_CreatedAt] DEFAULT ((sysutcdatetime())),
    [LastSeenAt] datetime2 NOT NULL CONSTRAINT [DF_UserSessions_LastSeenAt] DEFAULT ((sysutcdatetime())),
    [RevokedAt] datetime2 NULL,
    [RevokedByIp] nvarchar(64) NULL,
    CONSTRAINT [PK_UserSessions] PRIMARY KEY ([UserSessionId]),
    CONSTRAINT [FK_UserSessions_AppUsers] FOREIGN KEY ([AppUserId]) REFERENCES [AppUsers] ([AppUserId])
);

CREATE TABLE [WebsiteVisits] (
    [WebsiteVisitId] int NOT NULL IDENTITY,
    [VisitorId] uniqueidentifier NULL,
    [AppUserId] int NULL,
    [Path] nvarchar(300) NOT NULL,
    [Referrer] nvarchar(500) NULL,
    [IpAddress] nvarchar(100) NULL,
    [UserAgent] nvarchar(500) NULL,
    [CreatedAt] datetime2 NOT NULL CONSTRAINT [DF_WebsiteVisits_CreatedAt] DEFAULT ((sysutcdatetime())),
    CONSTRAINT [PK__WebsiteV__BFC387B4AC38460C] PRIMARY KEY ([WebsiteVisitId]),
    CONSTRAINT [FK_WebsiteVisits_AppUsers] FOREIGN KEY ([AppUserId]) REFERENCES [AppUsers] ([AppUserId])
);

CREATE TABLE [Products] (
    [ProductId] int NOT NULL IDENTITY,
    [ProductCategoryId] int NOT NULL,
    [ProductConditionId] int NOT NULL,
    [ProductName] nvarchar(150) NOT NULL,
    [Brand] nvarchar(100) NULL,
    [ModelName] nvarchar(100) NULL,
    [Description] nvarchar(1000) NULL,
    [Price] decimal(10,2) NOT NULL,
    [StockQuantity] int NOT NULL DEFAULT 1,
    [IsAvailable] bit NOT NULL DEFAULT CAST(1 AS bit),
    [IsFeatured] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT ((getdate())),
    [UpdatedAt] datetime2 NULL,
    [DeletedAt] datetime2 NULL,
    [PrimaryImageUrl] nvarchar(500) NULL,
    CONSTRAINT [PK__Products__B40CC6CD13B5D931] PRIMARY KEY ([ProductId]),
    CONSTRAINT [FK__Products__Produc__76969D2E] FOREIGN KEY ([ProductCategoryId]) REFERENCES [ProductCategories] ([ProductCategoryId]),
    CONSTRAINT [FK__Products__Produc__778AC167] FOREIGN KEY ([ProductConditionId]) REFERENCES [ProductConditions] ([ProductConditionId])
);

CREATE TABLE [AppUserRoles] (
    [AppUserId] int NOT NULL,
    [RoleId] int NOT NULL,
    [AssignedAt] datetime2 NOT NULL DEFAULT ((getdate())),
    CONSTRAINT [Pk_AppUserRoles] PRIMARY KEY ([AppUserId], [RoleId]),
    CONSTRAINT [FK_AppUserRoles_AppUsers] FOREIGN KEY ([AppUserId]) REFERENCES [AppUsers] ([AppUserId]),
    CONSTRAINT [FK_AppUserRoles_Roles] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([RoleId])
);

CREATE TABLE [AnnouncementViews] (
    [AnnouncementViewId] int NOT NULL IDENTITY,
    [AnnouncementId] int NOT NULL,
    [AppUserId] int NOT NULL,
    [ViewedAt] datetime NOT NULL CONSTRAINT [DF_AnnouncementViews_ViewedAt] DEFAULT ((getdate())),
    CONSTRAINT [PK__Announce__78F9B23903576BC6] PRIMARY KEY ([AnnouncementViewId]),
    CONSTRAINT [FK_AnnouncementViews_Announcements] FOREIGN KEY ([AnnouncementId]) REFERENCES [Announcements] ([AnnouncementId]),
    CONSTRAINT [FK_AnnouncementViews_AppUsers] FOREIGN KEY ([AppUserId]) REFERENCES [AppUsers] ([AppUserId])
);

CREATE TABLE [CustomerAddresses] (
    [CustomerAddressId] int NOT NULL IDENTITY,
    [CustomerId] int NOT NULL,
    [Label] nvarchar(50) NULL,
    [AddressLine] nvarchar(350) NOT NULL,
    [City] nvarchar(100) NOT NULL,
    [State] nvarchar(100) NOT NULL,
    [Pincode] nvarchar(20) NOT NULL,
    [IsDefault] bit NOT NULL,
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    [CreatedAt] datetime2 NOT NULL DEFAULT ((getdate())),
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK__Customer__DB891B78D0F6C3B8] PRIMARY KEY ([CustomerAddressId]),
    CONSTRAINT [FK__CustomerA__Custo__49C3F6B7] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([CustomerId])
);

CREATE TABLE [RefreshTokens] (
    [RefreshTokenId] int NOT NULL IDENTITY,
    [AppUserId] int NOT NULL,
    [TokenHash] nvarchar(256) NOT NULL,
    [ExpiresAt] datetime2 NOT NULL,
    [CreatedAt] datetime2 NOT NULL CONSTRAINT [DF_RefreshTokens_CreatedAt] DEFAULT ((sysutcdatetime())),
    [CreatedByIp] nvarchar(100) NULL,
    [UserAgent] nvarchar(500) NULL,
    [RevokedAt] datetime2 NULL,
    [RevokedByIp] nvarchar(100) NULL,
    [ReplacedByTokenHash] nvarchar(256) NULL,
    [UserSessionId] uniqueidentifier NULL,
    CONSTRAINT [PK__RefreshT__F5845E3949FF50F0] PRIMARY KEY ([RefreshTokenId]),
    CONSTRAINT [FK_RefreshTokens_AppUsers] FOREIGN KEY ([AppUserId]) REFERENCES [AppUsers] ([AppUserId]),
    CONSTRAINT [FK_RefreshTokens_UserSessions] FOREIGN KEY ([UserSessionId]) REFERENCES [UserSessions] ([UserSessionId])
);

CREATE TABLE [ProductImages] (
    [ProductImageId] int NOT NULL IDENTITY,
    [ProductId] int NOT NULL,
    [ImageUrl] nvarchar(500) NOT NULL,
    [AltText] nvarchar(200) NULL,
    [IsPrimary] bit NOT NULL,
    [SortOrder] int NOT NULL DEFAULT 1,
    [CreatedAt] datetime2 NOT NULL DEFAULT ((getdate())),
    CONSTRAINT [PK__ProductI__07B2B1B8FCA372B4] PRIMARY KEY ([ProductImageId]),
    CONSTRAINT [FK__ProductIm__Produ__00200768] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([ProductId])
);

CREATE TABLE [ServiceRequests] (
    [ServiceRequestId] int NOT NULL IDENTITY,
    [RequestNumber] nvarchar(40) NOT NULL,
    [CustomerId] int NULL,
    [CustomerAddressId] int NULL,
    [CustomerName] nvarchar(120) NOT NULL,
    [PhoneNumber] nvarchar(20) NOT NULL,
    [Email] nvarchar(150) NULL,
    [ServiceCategoryId] int NOT NULL,
    [DeviceName] nvarchar(120) NULL,
    [Brand] nvarchar(100) NULL,
    [ModelName] nvarchar(100) NULL,
    [IssueDescription] nvarchar(800) NOT NULL,
    [ServiceType] nvarchar(50) NOT NULL DEFAULT N'Home Visit',
    [VisitAddress] nvarchar(400) NULL,
    [PreferredDate] date NULL,
    [PreferredTimeSlot] nvarchar(80) NULL,
    [CurrentStatusId] int NOT NULL,
    [EstimatedPrice] decimal(10,2) NULL,
    [FinalPrice] decimal(10,2) NULL,
    [AdminNotes] nvarchar(800) NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT ((getdate())),
    [UpdatedAt] datetime2 NULL,
    [CompletedAt] datetime2 NULL,
    [CancelledAt] datetime2 NULL,
    [DeletedAt] datetime2 NULL,
    [ServiceLocationId] int NULL,
    [PaymentStatus] nvarchar(30) NOT NULL CONSTRAINT [DF_ServiceRequests_PaymentStatus] DEFAULT N'Pending',
    [PaidAt] datetime NULL,
    [Diagnosis] nvarchar(1000) NULL,
    [WorkNotes] nvarchar(1500) NULL,
    [PartsUsed] nvarchar(1000) NULL,
    [ShowRepairNotesToCustomer] bit NOT NULL DEFAULT CAST(1 AS bit),
    [WarrantyNote] nvarchar(500) NULL,
    CONSTRAINT [PK__ServiceR__790F6C8BB4A882F8] PRIMARY KEY ([ServiceRequestId]),
    CONSTRAINT [FK__ServiceRe__Curre__5DCAEF64] FOREIGN KEY ([CurrentStatusId]) REFERENCES [ServiceStatus] ([ServiceStatusId]),
    CONSTRAINT [FK__ServiceRe__Custo__59063A47] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([CustomerId]),
    CONSTRAINT [FK__ServiceRe__Custo__59FA5E80] FOREIGN KEY ([CustomerAddressId]) REFERENCES [CustomerAddresses] ([CustomerAddressId]),
    CONSTRAINT [FK__ServiceRe__Servi__151B244E] FOREIGN KEY ([ServiceLocationId]) REFERENCES [ServiceLocations] ([ServiceLocationId]),
    CONSTRAINT [FK__ServiceRe__Servi__5AEE82B9] FOREIGN KEY ([ServiceCategoryId]) REFERENCES [ServiceCategories] ([ServiceCategoryId])
);

CREATE TABLE [CustomerNotifications] (
    [CustomerNotificationId] int NOT NULL IDENTITY,
    [CustomerId] int NOT NULL,
    [ServiceRequestId] int NULL,
    [Title] nvarchar(150) NOT NULL,
    [Message] nvarchar(500) NOT NULL,
    [IsRead] bit NOT NULL,
    [CreatedAt] datetime NOT NULL CONSTRAINT [DF_CustomerNotifications_CreatedAt] DEFAULT ((getdate())),
    CONSTRAINT [PK__Customer__9E9BDBE6B5DE7B24] PRIMARY KEY ([CustomerNotificationId]),
    CONSTRAINT [FK__CustomerN__Custo__1CBC4616] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([CustomerId]),
    CONSTRAINT [FK__CustomerN__Servi__1DB06A4F] FOREIGN KEY ([ServiceRequestId]) REFERENCES [ServiceRequests] ([ServiceRequestId])
);

CREATE TABLE [CustomerRepairFeedbacks] (
    [CustomerRepairFeedbackId] int NOT NULL IDENTITY,
    [ServiceRequestId] int NOT NULL,
    [CustomerId] int NOT NULL,
    [Rating] int NOT NULL,
    [Comment] nvarchar(1000) NULL,
    [IsPublic] bit NOT NULL,
    [CreatedAt] datetime NOT NULL DEFAULT ((getdate())),
    [UpdatedAt] datetime NULL,
    CONSTRAINT [PK__Customer__6EBABC2110BB70E2] PRIMARY KEY ([CustomerRepairFeedbackId]),
    CONSTRAINT [FK__CustomerR__Custo__2EDAF651] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([CustomerId]),
    CONSTRAINT [FK__CustomerR__Servi__2DE6D218] FOREIGN KEY ([ServiceRequestId]) REFERENCES [ServiceRequests] ([ServiceRequestId])
);

CREATE TABLE [Enquiries] (
    [EnquiryId] int NOT NULL IDENTITY,
    [CustomerId] int NULL,
    [ProductId] int NULL,
    [ServiceRequestId] int NULL,
    [FullName] nvarchar(120) NOT NULL,
    [PhoneNumber] nvarchar(20) NOT NULL,
    [Email] nvarchar(150) NULL,
    [Subject] nvarchar(150) NULL,
    [Message] nvarchar(800) NOT NULL,
    [EnquiryStatusId] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT ((getdate())),
    [UpdatedAt] datetime2 NULL,
    [DeletedAt] datetime2 NULL,
    CONSTRAINT [PK__Enquirie__0A019B7DCAA5B70E] PRIMARY KEY ([EnquiryId]),
    CONSTRAINT [FK__Enquiries__Custo__09A971A2] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([CustomerId]),
    CONSTRAINT [FK__Enquiries__Enqui__0C85DE4D] FOREIGN KEY ([EnquiryStatusId]) REFERENCES [EnquiryStatuses] ([EnquiryStatusId]),
    CONSTRAINT [FK__Enquiries__Produ__0A9D95DB] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([ProductId]),
    CONSTRAINT [FK__Enquiries__Servi__0B91BA14] FOREIGN KEY ([ServiceRequestId]) REFERENCES [ServiceRequests] ([ServiceRequestId])
);

CREATE TABLE [ServiceAssignments] (
    [ServiceAssignmentId] int NOT NULL IDENTITY,
    [ServiceRequestId] int NOT NULL,
    [AssignedToAppUserId] int NOT NULL,
    [AssignedByAppUserId] int NULL,
    [AssignedAt] datetime2 NOT NULL DEFAULT ((getdate())),
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    CONSTRAINT [PK__ServiceA__F283B6103747A3F1] PRIMARY KEY ([ServiceAssignmentId]),
    CONSTRAINT [FK__ServiceAs__Assig__693CA210] FOREIGN KEY ([AssignedToAppUserId]) REFERENCES [AppUsers] ([AppUserId]),
    CONSTRAINT [FK__ServiceAs__Assig__6A30C649] FOREIGN KEY ([AssignedByAppUserId]) REFERENCES [AppUsers] ([AppUserId]),
    CONSTRAINT [FK__ServiceAs__Servi__68487DD7] FOREIGN KEY ([ServiceRequestId]) REFERENCES [ServiceRequests] ([ServiceRequestId])
);

CREATE TABLE [ServiceRequestImages] (
    [ServiceRequestImageId] int NOT NULL IDENTITY,
    [ServiceRequestId] int NOT NULL,
    [ImageUrl] nvarchar(500) NOT NULL,
    [OriginalFileName] nvarchar(255) NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT ((sysutcdatetime())),
    CONSTRAINT [PK__ServiceR__DFB13AEB11646E3B] PRIMARY KEY ([ServiceRequestImageId]),
    CONSTRAINT [FK_ServiceRequestImages_ServiceRequests] FOREIGN KEY ([ServiceRequestId]) REFERENCES [ServiceRequests] ([ServiceRequestId])
);

CREATE TABLE [ServiceRequestStatusHistory] (
    [StatusHistoryId] int NOT NULL IDENTITY,
    [ServiceRequestId] int NOT NULL,
    [OldStatusId] int NULL,
    [NewStatusId] int NOT NULL,
    [ChangedByAppUserId] int NULL,
    [Note] nvarchar(500) NULL,
    [ChangedAt] datetime2 NOT NULL DEFAULT ((getdate())),
    CONSTRAINT [PK__ServiceR__DB973491C71B373D] PRIMARY KEY ([StatusHistoryId]),
    CONSTRAINT [FK__ServiceRe__Chang__6477ECF3] FOREIGN KEY ([ChangedByAppUserId]) REFERENCES [AppUsers] ([AppUserId]),
    CONSTRAINT [FK__ServiceRe__NewSt__6383C8BA] FOREIGN KEY ([NewStatusId]) REFERENCES [ServiceStatus] ([ServiceStatusId]),
    CONSTRAINT [FK__ServiceRe__OldSt__628FA481] FOREIGN KEY ([OldStatusId]) REFERENCES [ServiceStatus] ([ServiceStatusId]),
    CONSTRAINT [FK__ServiceRe__Servi__619B8048] FOREIGN KEY ([ServiceRequestId]) REFERENCES [ServiceRequests] ([ServiceRequestId])
);

CREATE TABLE [AdminNotifications] (
    [AdminNotificationId] int NOT NULL IDENTITY,
    [ServiceRequestId] int NULL,
    [EnquiryId] int NULL,
    [ProductId] int NULL,
    [Title] nvarchar(150) NOT NULL,
    [Message] nvarchar(500) NOT NULL,
    [NotificationType] nvarchar(50) NOT NULL,
    [IsRead] bit NOT NULL,
    [CreatedAt] datetime NOT NULL DEFAULT ((getdate())),
    CONSTRAINT [PK__AdminNot__EC88D08D900CDBC8] PRIMARY KEY ([AdminNotificationId]),
    CONSTRAINT [FK__AdminNoti__Enqui__236943A5] FOREIGN KEY ([EnquiryId]) REFERENCES [Enquiries] ([EnquiryId]),
    CONSTRAINT [FK__AdminNoti__Produ__245D67DE] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([ProductId]),
    CONSTRAINT [FK__AdminNoti__Servi__22751F6C] FOREIGN KEY ([ServiceRequestId]) REFERENCES [ServiceRequests] ([ServiceRequestId])
);

CREATE TABLE [EnquiryNotes] (
    [EnquiryNoteId] int NOT NULL IDENTITY,
    [EnquiryId] int NOT NULL,
    [Note] nvarchar(1000) NOT NULL,
    [CreatedAt] datetime NOT NULL DEFAULT ((getdate())),
    CONSTRAINT [PK__EnquiryN__E6661A582F19D39A] PRIMARY KEY ([EnquiryNoteId]),
    CONSTRAINT [FK__EnquiryNo__Enqui__29221CFB] FOREIGN KEY ([EnquiryId]) REFERENCES [Enquiries] ([EnquiryId])
);

CREATE INDEX [IX_AdminNotifications_EnquiryId] ON [AdminNotifications] ([EnquiryId]);

CREATE INDEX [IX_AdminNotifications_ProductId] ON [AdminNotifications] ([ProductId]);

CREATE INDEX [IX_AdminNotifications_ServiceRequestId] ON [AdminNotifications] ([ServiceRequestId]);

CREATE INDEX [IX_Announcements_CreatedByAppUserId] ON [Announcements] ([CreatedByAppUserId]);

CREATE INDEX [IX_AnnouncementViews_AppUserId] ON [AnnouncementViews] ([AppUserId]);

CREATE UNIQUE INDEX [UQ_AnnouncementViews_Announcement_User] ON [AnnouncementViews] ([AnnouncementId], [AppUserId]);

CREATE INDEX [IX_AppUserRoles_RoleId] ON [AppUserRoles] ([RoleId]);

CREATE INDEX [IX_AppUsers_ClerkUserId] ON [AppUsers] ([ClerkUserId]);

CREATE INDEX [IX_AppUsers_Email] ON [AppUsers] ([Email]);

CREATE UNIQUE INDEX [UX_AppUsers_ClerkUserId_NotNull] ON [AppUsers] ([ClerkUserId]) WHERE ([ClerkUserId] IS NOT NULL);

CREATE UNIQUE INDEX [UX_AppUsers_NormalizedEmail_Active] ON [AppUsers] ([NormalizedEmail]) WHERE ([DeletedAt] IS NULL);

CREATE INDEX [IX_AuditLogs_AppUserId_CreatedAt] ON [AuditLogs] ([AppUserId], [CreatedAt] DESC);

CREATE INDEX [IX_AuditLogs_CreatedAt] ON [AuditLogs] ([CreatedAt] DESC);

CREATE INDEX [IX_AuditLogs_Entity_CreatedAt] ON [AuditLogs] ([EntityName], [EntityId], [CreatedAt] DESC);

CREATE INDEX [IX_CustomerAddresses_CustomerId] ON [CustomerAddresses] ([CustomerId]);

CREATE INDEX [IX_CustomerNotifications_CustomerId] ON [CustomerNotifications] ([CustomerId]);

CREATE INDEX [IX_CustomerNotifications_ServiceRequestId] ON [CustomerNotifications] ([ServiceRequestId]);

CREATE INDEX [IX_CustomerRepairFeedbacks_CustomerId] ON [CustomerRepairFeedbacks] ([CustomerId]);

CREATE UNIQUE INDEX [UX_CustomerRepairFeedbacks_ServiceRequest_Customer] ON [CustomerRepairFeedbacks] ([ServiceRequestId], [CustomerId]);

CREATE UNIQUE INDEX [UX_Customers_AppUserId] ON [Customers] ([AppUserId]) WHERE ([AppUserId] IS NOT NULL);

CREATE INDEX [UX_Customers_PhoneNumber] ON [Customers] ([PhoneNumber]);

CREATE INDEX [IX_Enquiries_CustomerId] ON [Enquiries] ([CustomerId]);

CREATE INDEX [IX_Enquiries_EnquiryStatusId] ON [Enquiries] ([EnquiryStatusId]);

CREATE INDEX [IX_Enquiries_ProductId] ON [Enquiries] ([ProductId]);

CREATE INDEX [IX_Enquiries_ServiceRequestId] ON [Enquiries] ([ServiceRequestId]);

CREATE INDEX [IX_EnquiryNotes_EnquiryId] ON [EnquiryNotes] ([EnquiryId]);

CREATE UNIQUE INDEX [UQ__EnquiryS__05E7698A03F9A8EC] ON [EnquiryStatuses] ([StatusName]);

CREATE INDEX [IX_ExternalLogins_AppUserId] ON [ExternalLogins] ([AppUserId]);

CREATE UNIQUE INDEX [UX_ExternalLogins_Provider_ProviderUserId] ON [ExternalLogins] ([Provider], [ProviderUserId]);

CREATE INDEX [IX_OtpCodes_AppUserId] ON [OtpCodes] ([AppUserId]);

CREATE INDEX [IX_OtpCodes_ExpiresAt] ON [OtpCodes] ([ExpiresAt]);

CREATE INDEX [IX_OtpCodes_NormalizedEmail_Purpose] ON [OtpCodes] ([NormalizedEmail], [Purpose], [CreatedAt] DESC);

CREATE INDEX [IX_PasswordResetSessions_AppUserId] ON [PasswordResetSessions] ([AppUserId]);

CREATE UNIQUE INDEX [UX_PasswordResetSessions_TokenHash] ON [PasswordResetSessions] ([TokenHash]);

CREATE UNIQUE INDEX [UQ__ProductC__8517B2E0EA0DC3E1] ON [ProductCategories] ([CategoryName]);

CREATE UNIQUE INDEX [UQ__ProductC__CE7E606616D3651C] ON [ProductConditions] ([ConditionName]);

CREATE INDEX [IX_ProductImages_ProductId] ON [ProductImages] ([ProductId]);

CREATE INDEX [IX_Products_IsAvailable] ON [Products] ([IsAvailable]);

CREATE INDEX [IX_Products_IsFeatured] ON [Products] ([IsFeatured]);

CREATE INDEX [IX_Products_ProductCategoryId] ON [Products] ([ProductCategoryId]);

CREATE INDEX [IX_Products_ProductConditionId] ON [Products] ([ProductConditionId]);

CREATE INDEX [IX_RefreshTokens_AppUserId] ON [RefreshTokens] ([AppUserId]);

CREATE INDEX [IX_RefreshTokens_ExpiresAt] ON [RefreshTokens] ([ExpiresAt]);

CREATE INDEX [IX_RefreshTokens_UserSessionId] ON [RefreshTokens] ([UserSessionId]);

CREATE UNIQUE INDEX [UX_RefreshTokens_TokenHash] ON [RefreshTokens] ([TokenHash]);

CREATE UNIQUE INDEX [UQ__Roles__8A2B61603E360396] ON [Roles] ([RoleName]);

CREATE INDEX [IX_ServiceAssignments_AssignedByAppUserId] ON [ServiceAssignments] ([AssignedByAppUserId]);

CREATE INDEX [IX_ServiceAssignments_AssignedToAppUserId] ON [ServiceAssignments] ([AssignedToAppUserId]);

CREATE INDEX [IX_ServiceAssignments_ServiceRequestId] ON [ServiceAssignments] ([ServiceRequestId]);

CREATE UNIQUE INDEX [UQ__ServiceC__8517B2E0501C19A7] ON [ServiceCategories] ([CategoryName]);

CREATE INDEX [IX_ServiceRequestImages_ServiceRequestId] ON [ServiceRequestImages] ([ServiceRequestId]);

CREATE INDEX [IX_ServiceRequests_CreatedAt] ON [ServiceRequests] ([CreatedAt]);

CREATE INDEX [IX_ServiceRequests_CurrentStatusId] ON [ServiceRequests] ([CurrentStatusId]);

CREATE INDEX [IX_ServiceRequests_CustomerAddressId] ON [ServiceRequests] ([CustomerAddressId]);

CREATE INDEX [IX_ServiceRequests_CustomerId] ON [ServiceRequests] ([CustomerId]);

CREATE INDEX [IX_ServiceRequests_PhoneNumber] ON [ServiceRequests] ([PhoneNumber]);

CREATE INDEX [IX_ServiceRequests_RequestNumber] ON [ServiceRequests] ([RequestNumber]);

CREATE INDEX [IX_ServiceRequests_ServiceCategoryId] ON [ServiceRequests] ([ServiceCategoryId]);

CREATE INDEX [IX_ServiceRequests_ServiceLocationId] ON [ServiceRequests] ([ServiceLocationId]);

CREATE UNIQUE INDEX [UQ__ServiceR__9ADA6BE0535B494D] ON [ServiceRequests] ([RequestNumber]);

CREATE INDEX [IX_ServiceRequestStatusHistory_ChangedByAppUserId] ON [ServiceRequestStatusHistory] ([ChangedByAppUserId]);

CREATE INDEX [IX_ServiceRequestStatusHistory_NewStatusId] ON [ServiceRequestStatusHistory] ([NewStatusId]);

CREATE INDEX [IX_ServiceRequestStatusHistory_OldStatusId] ON [ServiceRequestStatusHistory] ([OldStatusId]);

CREATE INDEX [IX_ServiceRequestStatusHistory_ServiceRequestId] ON [ServiceRequestStatusHistory] ([ServiceRequestId]);

CREATE UNIQUE INDEX [UQ__ServiceS__05E7698AC4AEA66D] ON [ServiceStatus] ([StatusName]);

CREATE INDEX [IX_UserAuthEvents_AppUserId_CreatedAt] ON [UserAuthEvents] ([AppUserId], [CreatedAt] DESC);

CREATE INDEX [IX_UserAuthEvents_Email_CreatedAt] ON [UserAuthEvents] ([Email], [CreatedAt] DESC);

CREATE INDEX [IX_UserAuthEvents_EventType_CreatedAt] ON [UserAuthEvents] ([EventType], [CreatedAt] DESC);

CREATE INDEX [IX_UserSessions_AppUserId_RevokedAt] ON [UserSessions] ([AppUserId], [RevokedAt]);

CREATE INDEX [IX_UserSessions_LastSeenAt] ON [UserSessions] ([LastSeenAt]);

CREATE INDEX [IX_WebsiteVisits_AppUserId_CreatedAt] ON [WebsiteVisits] ([AppUserId], [CreatedAt] DESC);

CREATE INDEX [IX_WebsiteVisits_CreatedAt] ON [WebsiteVisits] ([CreatedAt] DESC);

CREATE INDEX [IX_WebsiteVisits_Path_CreatedAt] ON [WebsiteVisits] ([Path], [CreatedAt] DESC);

CREATE INDEX [IX_WebsiteVisits_VisitorId_CreatedAt] ON [WebsiteVisits] ([VisitorId], [CreatedAt] DESC);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260804122610_InitialCreate', N'10.0.9');

COMMIT;
GO

