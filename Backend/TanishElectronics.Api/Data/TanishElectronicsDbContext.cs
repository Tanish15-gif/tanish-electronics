using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Data;

public partial class TanishElectronicsDbContext : DbContext
{
    public TanishElectronicsDbContext(DbContextOptions<TanishElectronicsDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AdminNotification> AdminNotifications { get; set; }

    public virtual DbSet<Announcement> Announcements { get; set; }

    public virtual DbSet<AnnouncementView> AnnouncementViews { get; set; }

    public virtual DbSet<AppUser> AppUsers { get; set; }

    public virtual DbSet<AppUserRole> AppUserRoles { get; set; }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<Customer> Customers { get; set; }

    public virtual DbSet<CustomerAddress> CustomerAddresses { get; set; }

    public virtual DbSet<CustomerNotification> CustomerNotifications { get; set; }

    public virtual DbSet<CustomerRepairFeedback> CustomerRepairFeedbacks { get; set; }

    public virtual DbSet<Enquiry> Enquiries { get; set; }

    public virtual DbSet<EnquiryNote> EnquiryNotes { get; set; }

    public virtual DbSet<EnquiryStatus> EnquiryStatuses { get; set; }

    public virtual DbSet<ExternalLogin> ExternalLogins { get; set; }

    public virtual DbSet<OtpCode> OtpCodes { get; set; }

    public virtual DbSet<PasswordResetSession> PasswordResetSessions { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductCategory> ProductCategories { get; set; }

    public virtual DbSet<ProductCondition> ProductConditions { get; set; }

    public virtual DbSet<ProductImage> ProductImages { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<ServiceAssignment> ServiceAssignments { get; set; }

    public virtual DbSet<ServiceCategory> ServiceCategories { get; set; }

    public virtual DbSet<ServiceLocation> ServiceLocations { get; set; }

    public virtual DbSet<ServiceRequest> ServiceRequests { get; set; }

    public virtual DbSet<ServiceRequestImage> ServiceRequestImages { get; set; }

    public virtual DbSet<ServiceRequestStatusHistory> ServiceRequestStatusHistories { get; set; }

    public virtual DbSet<ServiceStatus> ServiceStatuses { get; set; }

    public virtual DbSet<ShopBusinessSetting> ShopBusinessSettings { get; set; }

    public virtual DbSet<UserAuthEvent> UserAuthEvents { get; set; }

    public virtual DbSet<WebsiteVisit> WebsiteVisits { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AdminNotification>(entity =>
        {
            entity.HasKey(e => e.AdminNotificationId).HasName("PK__AdminNot__EC88D08D900CDBC8");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Message).HasMaxLength(500);
            entity.Property(e => e.NotificationType).HasMaxLength(50);
            entity.Property(e => e.Title).HasMaxLength(150);

            entity.HasOne(d => d.Enquiry).WithMany(p => p.AdminNotifications)
                .HasForeignKey(d => d.EnquiryId)
                .HasConstraintName("FK__AdminNoti__Enqui__236943A5");

            entity.HasOne(d => d.Product).WithMany(p => p.AdminNotifications)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK__AdminNoti__Produ__245D67DE");

            entity.HasOne(d => d.ServiceRequest).WithMany(p => p.AdminNotifications)
                .HasForeignKey(d => d.ServiceRequestId)
                .HasConstraintName("FK__AdminNoti__Servi__22751F6C");
        });

        modelBuilder.Entity<Announcement>(entity =>
        {
            entity.HasKey(e => e.AnnouncementId).HasName("PK__Announce__9DE44574EC2120EF");

            entity.Property(e => e.AnnouncementType).HasMaxLength(50);
            entity.Property(e => e.Audience).HasMaxLength(50);
            entity.Property(e => e.ButtonLink).HasMaxLength(500);
            entity.Property(e => e.ButtonText).HasMaxLength(80);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.DisplayLocation).HasMaxLength(50);
            entity.Property(e => e.EndAt).HasColumnType("datetime");
            entity.Property(e => e.ImageUrl).HasMaxLength(1000);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Message).HasMaxLength(1000);
            entity.Property(e => e.Priority).HasDefaultValue(2);
            entity.Property(e => e.ShowOnce).HasDefaultValue(true);
            entity.Property(e => e.StartAt).HasColumnType("datetime");
            entity.Property(e => e.Title).HasMaxLength(150);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.CreatedByAppUser).WithMany(p => p.Announcements)
                .HasForeignKey(d => d.CreatedByAppUserId)
                .HasConstraintName("FK__Announcem__Creat__37703C52");
        });

        modelBuilder.Entity<AnnouncementView>(entity =>
        {
            entity.HasKey(e => e.AnnouncementViewId).HasName("PK__Announce__78F9B23903576BC6");

            entity.HasIndex(e => new { e.AnnouncementId, e.AppUserId }, "UQ_AnnouncementViews_Announcement_User").IsUnique();

            entity.Property(e => e.ViewedAt)
                .HasDefaultValueSql("(getdate())", "DF_AnnouncementViews_ViewedAt")
                .HasColumnType("datetime");

            entity.HasOne(d => d.Announcement).WithMany(p => p.AnnouncementViews)
                .HasForeignKey(d => d.AnnouncementId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AnnouncementViews_Announcements");

            entity.HasOne(d => d.AppUser).WithMany(p => p.AnnouncementViews)
                .HasForeignKey(d => d.AppUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AnnouncementViews_AppUsers");
        });

        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasKey(e => e.AppUserId).HasName("PK__AppUsers__FC65C73016001A02");

            entity.HasIndex(e => e.ClerkUserId, "IX_AppUsers_ClerkUserId");

            entity.HasIndex(e => e.Email, "IX_AppUsers_Email");

            entity.HasIndex(e => e.ClerkUserId, "UX_AppUsers_ClerkUserId_NotNull")
                .IsUnique()
                .HasFilter("([ClerkUserId] IS NOT NULL)");

            entity.HasIndex(e => e.NormalizedEmail, "UX_AppUsers_NormalizedEmail_Active")
                .IsUnique()
                .HasFilter("([DeletedAt] IS NULL)");

            entity.Property(e => e.ClerkUserId).HasMaxLength(150);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.FullName).HasMaxLength(120);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.NormalizedEmail).HasMaxLength(150);
            entity.Property(e => e.PasswordHash).HasMaxLength(500);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.ProfileImageSource).HasMaxLength(30);
            entity.Property(e => e.ProfileImageUrl).HasMaxLength(2048);
        });

        modelBuilder.Entity<AppUserRole>(entity =>
        {
            entity.HasKey(e => new { e.AppUserId, e.RoleId }).HasName("Pk_AppUserRoles");

            entity.Property(e => e.AssignedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.AppUser).WithMany(p => p.AppUserRoles)
                .HasForeignKey(d => d.AppUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AppUserRoles_AppUsers");

            entity.HasOne(d => d.Role).WithMany(p => p.AppUserRoles)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AppUserRoles_Roles");
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.AuditLogId).HasName("PK__AuditLog__EB5F6CBDA7ADE757");

            entity.HasIndex(e => new { e.AppUserId, e.CreatedAt }, "IX_AuditLogs_AppUserId_CreatedAt").IsDescending(false, true);

            entity.HasIndex(e => e.CreatedAt, "IX_AuditLogs_CreatedAt").IsDescending();

            entity.HasIndex(e => new { e.EntityName, e.EntityId, e.CreatedAt }, "IX_AuditLogs_Entity_CreatedAt").IsDescending(false, false, true);

            entity.Property(e => e.Action).HasMaxLength(100);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.EntityName).HasMaxLength(100);
            entity.Property(e => e.IpAddress).HasMaxLength(100);
            entity.Property(e => e.UserAgent).HasMaxLength(500);

            entity.HasOne(d => d.AppUser).WithMany(p => p.AuditLogs)
                .HasForeignKey(d => d.AppUserId)
                .HasConstraintName("FK_AuditLogs_AppUsers");
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(e => e.CustomerId).HasName("PK__Customer__A4AE64D8030B87BC");

            entity.HasIndex(e => e.AppUserId, "UX_Customers_AppUserId")
                .IsUnique()
                .HasFilter("([AppUserId] IS NOT NULL)");

            entity.HasIndex(e => e.PhoneNumber, "UX_Customers_PhoneNumber");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.FullName).HasMaxLength(120);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);

            entity.HasOne(d => d.AppUser).WithOne(p => p.Customer)
                .HasForeignKey<Customer>(d => d.AppUserId)
                .HasConstraintName("FK__Customers__AppUs__44FF419A");
        });

        modelBuilder.Entity<CustomerAddress>(entity =>
        {
            entity.HasKey(e => e.CustomerAddressId).HasName("PK__Customer__DB891B78D0F6C3B8");

            entity.Property(e => e.AddressLine).HasMaxLength(350);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Label).HasMaxLength(50);
            entity.Property(e => e.Pincode).HasMaxLength(20);
            entity.Property(e => e.State).HasMaxLength(100);

            entity.HasOne(d => d.Customer).WithMany(p => p.CustomerAddresses)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__CustomerA__Custo__49C3F6B7");
        });

        modelBuilder.Entity<CustomerNotification>(entity =>
        {
            entity.HasKey(e => e.CustomerNotificationId).HasName("PK__Customer__9E9BDBE6B5DE7B24");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())", "DF_CustomerNotifications_CreatedAt")
                .HasColumnType("datetime");
            entity.Property(e => e.Message).HasMaxLength(500);
            entity.Property(e => e.Title).HasMaxLength(150);

            entity.HasOne(d => d.Customer).WithMany(p => p.CustomerNotifications)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__CustomerN__Custo__1CBC4616");

            entity.HasOne(d => d.ServiceRequest).WithMany(p => p.CustomerNotifications)
                .HasForeignKey(d => d.ServiceRequestId)
                .HasConstraintName("FK__CustomerN__Servi__1DB06A4F");
        });

        modelBuilder.Entity<CustomerRepairFeedback>(entity =>
        {
            entity.HasKey(e => e.CustomerRepairFeedbackId).HasName("PK__Customer__6EBABC2110BB70E2");

            entity.HasIndex(e => new { e.ServiceRequestId, e.CustomerId }, "UX_CustomerRepairFeedbacks_ServiceRequest_Customer").IsUnique();

            entity.Property(e => e.Comment).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");

            entity.HasOne(d => d.Customer).WithMany(p => p.CustomerRepairFeedbacks)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__CustomerR__Custo__2EDAF651");

            entity.HasOne(d => d.ServiceRequest).WithMany(p => p.CustomerRepairFeedbacks)
                .HasForeignKey(d => d.ServiceRequestId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__CustomerR__Servi__2DE6D218");
        });

        modelBuilder.Entity<Enquiry>(entity =>
        {
            entity.HasKey(e => e.EnquiryId).HasName("PK__Enquirie__0A019B7DCAA5B70E");

            entity.HasIndex(e => e.EnquiryStatusId, "IX_Enquiries_EnquiryStatusId");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.FullName).HasMaxLength(120);
            entity.Property(e => e.Message).HasMaxLength(800);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.Subject).HasMaxLength(150);

            entity.HasOne(d => d.Customer).WithMany(p => p.Enquiries)
                .HasForeignKey(d => d.CustomerId)
                .HasConstraintName("FK__Enquiries__Custo__09A971A2");

            entity.HasOne(d => d.EnquiryStatus).WithMany(p => p.Enquiries)
                .HasForeignKey(d => d.EnquiryStatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Enquiries__Enqui__0C85DE4D");

            entity.HasOne(d => d.Product).WithMany(p => p.Enquiries)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK__Enquiries__Produ__0A9D95DB");

            entity.HasOne(d => d.ServiceRequest).WithMany(p => p.Enquiries)
                .HasForeignKey(d => d.ServiceRequestId)
                .HasConstraintName("FK__Enquiries__Servi__0B91BA14");
        });

        modelBuilder.Entity<EnquiryNote>(entity =>
        {
            entity.HasKey(e => e.EnquiryNoteId).HasName("PK__EnquiryN__E6661A582F19D39A");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Note).HasMaxLength(1000);

            entity.HasOne(d => d.Enquiry).WithMany(p => p.EnquiryNotes)
                .HasForeignKey(d => d.EnquiryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__EnquiryNo__Enqui__29221CFB");
        });

        modelBuilder.Entity<EnquiryStatus>(entity =>
        {
            entity.HasKey(e => e.EnquiryStatusId).HasName("PK__EnquiryS__C8FB76E203611CE3");

            entity.HasIndex(e => e.StatusName, "UQ__EnquiryS__05E7698A03F9A8EC").IsUnique();

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.StatusName).HasMaxLength(50);
        });

        modelBuilder.Entity<ExternalLogin>(entity =>
        {
            entity.HasKey(e => e.ExternalLoginId).HasName("PK__External__A8FDB3AEFF7E58AD");

            entity.HasIndex(e => e.AppUserId, "IX_ExternalLogins_AppUserId");

            entity.HasIndex(e => new { e.Provider, e.ProviderUserId }, "UX_ExternalLogins_Provider_ProviderUserId").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())", "DF_ExternalLogins_CreatedAt");
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.Provider).HasMaxLength(50);
            entity.Property(e => e.ProviderUserId).HasMaxLength(200);

            entity.HasOne(d => d.AppUser).WithMany(p => p.ExternalLogins)
                .HasForeignKey(d => d.AppUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ExternalLogins_AppUsers");
        });

        modelBuilder.Entity<OtpCode>(entity =>
        {
            entity.HasKey(e => e.OtpCodeId).HasName("PK__OtpCodes__A67C33971CBB5268");

            entity.HasIndex(e => e.ExpiresAt, "IX_OtpCodes_ExpiresAt");

            entity.HasIndex(e => new { e.NormalizedEmail, e.Purpose, e.CreatedAt }, "IX_OtpCodes_NormalizedEmail_Purpose").IsDescending(false, false, true);

            entity.Property(e => e.CodeHash).HasMaxLength(256);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())", "DF_OtpCodes_CreatedAt");
            entity.Property(e => e.CreatedByIp).HasMaxLength(100);
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.NormalizedEmail).HasMaxLength(150);
            entity.Property(e => e.Purpose).HasMaxLength(50);

            entity.HasOne(d => d.AppUser).WithMany(p => p.OtpCodes)
                .HasForeignKey(d => d.AppUserId)
                .HasConstraintName("FK_OtpCodes_AppUsers");
        });

        modelBuilder.Entity<PasswordResetSession>(entity =>
        {
            entity.HasKey(e => e.PasswordResetSessionId).HasName("PK__Password__6F719DD56034C09F");

            entity.HasIndex(e => e.AppUserId, "IX_PasswordResetSessions_AppUserId");

            entity.HasIndex(e => e.TokenHash, "UX_PasswordResetSessions_TokenHash").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())", "DF_PasswordResetSessions_CreatedAt");
            entity.Property(e => e.CreatedByIp).HasMaxLength(64);
            entity.Property(e => e.TokenHash).HasMaxLength(200);

            entity.HasOne(d => d.AppUser).WithMany(p => p.PasswordResetSessions)
                .HasForeignKey(d => d.AppUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PasswordResetSessions_AppUsers");
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.ProductId).HasName("PK__Products__B40CC6CD13B5D931");

            entity.HasIndex(e => e.IsAvailable, "IX_Products_IsAvailable");

            entity.HasIndex(e => e.IsFeatured, "IX_Products_IsFeatured");

            entity.HasIndex(e => e.ProductCategoryId, "IX_Products_ProductCategoryId");

            entity.Property(e => e.Brand).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.IsAvailable).HasDefaultValue(true);
            entity.Property(e => e.ModelName).HasMaxLength(100);
            entity.Property(e => e.Price).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.PrimaryImageUrl).HasMaxLength(500);
            entity.Property(e => e.ProductName).HasMaxLength(150);
            entity.Property(e => e.StockQuantity).HasDefaultValue(1);

            entity.HasOne(d => d.ProductCategory).WithMany(p => p.Products)
                .HasForeignKey(d => d.ProductCategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Products__Produc__76969D2E");

            entity.HasOne(d => d.ProductCondition).WithMany(p => p.Products)
                .HasForeignKey(d => d.ProductConditionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Products__Produc__778AC167");
        });

        modelBuilder.Entity<ProductCategory>(entity =>
        {
            entity.HasKey(e => e.ProductCategoryId).HasName("PK__ProductC__3224ECCE5A079966");

            entity.HasIndex(e => e.CategoryName, "UQ__ProductC__8517B2E0EA0DC3E1").IsUnique();

            entity.Property(e => e.CategoryName).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Description).HasMaxLength(300);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<ProductCondition>(entity =>
        {
            entity.HasKey(e => e.ProductConditionId).HasName("PK__ProductC__D6ABB173646A7755");

            entity.HasIndex(e => e.ConditionName, "UQ__ProductC__CE7E606616D3651C").IsUnique();

            entity.Property(e => e.ConditionName).HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(250);
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(e => e.ProductImageId).HasName("PK__ProductI__07B2B1B8FCA372B4");

            entity.Property(e => e.AltText).HasMaxLength(200);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.SortOrder).HasDefaultValue(1);

            entity.HasOne(d => d.Product).WithMany(p => p.ProductImages)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__ProductIm__Produ__00200768");
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.RefreshTokenId).HasName("PK__RefreshT__F5845E3949FF50F0");

            entity.HasIndex(e => e.AppUserId, "IX_RefreshTokens_AppUserId");

            entity.HasIndex(e => e.ExpiresAt, "IX_RefreshTokens_ExpiresAt");

            entity.HasIndex(e => e.TokenHash, "UX_RefreshTokens_TokenHash").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())", "DF_RefreshTokens_CreatedAt");
            entity.Property(e => e.CreatedByIp).HasMaxLength(100);
            entity.Property(e => e.ReplacedByTokenHash).HasMaxLength(256);
            entity.Property(e => e.RevokedByIp).HasMaxLength(100);
            entity.Property(e => e.TokenHash).HasMaxLength(256);
            entity.Property(e => e.UserAgent).HasMaxLength(500);

            entity.HasOne(d => d.AppUser).WithMany(p => p.RefreshTokens)
                .HasForeignKey(d => d.AppUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_RefreshTokens_AppUsers");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("PK__Roles__8AFACE1A9C878CA8");

            entity.HasIndex(e => e.RoleName, "UQ__Roles__8A2B61603E360396").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Description).HasMaxLength(100);
            entity.Property(e => e.RoleName).HasMaxLength(50);
        });

        modelBuilder.Entity<ServiceAssignment>(entity =>
        {
            entity.HasKey(e => e.ServiceAssignmentId).HasName("PK__ServiceA__F283B6103747A3F1");

            entity.Property(e => e.AssignedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.AssignedByAppUser).WithMany(p => p.ServiceAssignmentAssignedByAppUsers)
                .HasForeignKey(d => d.AssignedByAppUserId)
                .HasConstraintName("FK__ServiceAs__Assig__6A30C649");

            entity.HasOne(d => d.AssignedToAppUser).WithMany(p => p.ServiceAssignmentAssignedToAppUsers)
                .HasForeignKey(d => d.AssignedToAppUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__ServiceAs__Assig__693CA210");

            entity.HasOne(d => d.ServiceRequest).WithMany(p => p.ServiceAssignments)
                .HasForeignKey(d => d.ServiceRequestId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__ServiceAs__Servi__68487DD7");
        });

        modelBuilder.Entity<ServiceCategory>(entity =>
        {
            entity.HasKey(e => e.ServiceCategoryId).HasName("PK__ServiceC__E4CC7EAA8FB47EA1");

            entity.HasIndex(e => e.CategoryName, "UQ__ServiceC__8517B2E0501C19A7").IsUnique();

            entity.Property(e => e.CategoryName).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Description).HasMaxLength(300);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<ServiceLocation>(entity =>
        {
            entity.HasKey(e => e.ServiceLocationId).HasName("PK__ServiceL__8CC619AC581EADC8");

            entity.Property(e => e.City)
                .HasMaxLength(100)
                .HasDefaultValue("Mumbai");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsHomeVisitAvailable).HasDefaultValue(true);
            entity.Property(e => e.LocationName).HasMaxLength(120);
            entity.Property(e => e.PinCode).HasMaxLength(20);
        });

        modelBuilder.Entity<ServiceRequest>(entity =>
        {
            entity.HasKey(e => e.ServiceRequestId).HasName("PK__ServiceR__790F6C8BB4A882F8");

            entity.HasIndex(e => e.CreatedAt, "IX_ServiceRequests_CreatedAt");

            entity.HasIndex(e => e.CurrentStatusId, "IX_ServiceRequests_CurrentStatusId");

            entity.HasIndex(e => e.PhoneNumber, "IX_ServiceRequests_PhoneNumber");

            entity.HasIndex(e => e.RequestNumber, "IX_ServiceRequests_RequestNumber");

            entity.HasIndex(e => e.RequestNumber, "UQ__ServiceR__9ADA6BE0535B494D").IsUnique();

            entity.Property(e => e.AdminNotes).HasMaxLength(800);
            entity.Property(e => e.Brand).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.CustomerName).HasMaxLength(120);
            entity.Property(e => e.DeviceName).HasMaxLength(120);
            entity.Property(e => e.Diagnosis).HasMaxLength(1000);
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.EstimatedPrice).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.FinalPrice).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.IssueDescription).HasMaxLength(800);
            entity.Property(e => e.ModelName).HasMaxLength(100);
            entity.Property(e => e.PaidAt).HasColumnType("datetime");
            entity.Property(e => e.PartsUsed).HasMaxLength(1000);
            entity.Property(e => e.PaymentStatus)
                .HasMaxLength(30)
                .HasDefaultValue("Pending", "DF_ServiceRequests_PaymentStatus");
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.PreferredTimeSlot).HasMaxLength(80);
            entity.Property(e => e.RequestNumber).HasMaxLength(40);
            entity.Property(e => e.ServiceType)
                .HasMaxLength(50)
                .HasDefaultValue("Home Visit");
            entity.Property(e => e.ShowRepairNotesToCustomer).HasDefaultValue(true);
            entity.Property(e => e.VisitAddress).HasMaxLength(400);
            entity.Property(e => e.WarrantyNote).HasMaxLength(500);
            entity.Property(e => e.WorkNotes).HasMaxLength(1500);

            entity.HasOne(d => d.CurrentStatus).WithMany(p => p.ServiceRequests)
                .HasForeignKey(d => d.CurrentStatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__ServiceRe__Curre__5DCAEF64");

            entity.HasOne(d => d.CustomerAddress).WithMany(p => p.ServiceRequests)
                .HasForeignKey(d => d.CustomerAddressId)
                .HasConstraintName("FK__ServiceRe__Custo__59FA5E80");

            entity.HasOne(d => d.Customer).WithMany(p => p.ServiceRequests)
                .HasForeignKey(d => d.CustomerId)
                .HasConstraintName("FK__ServiceRe__Custo__59063A47");

            entity.HasOne(d => d.ServiceCategory).WithMany(p => p.ServiceRequests)
                .HasForeignKey(d => d.ServiceCategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__ServiceRe__Servi__5AEE82B9");

            entity.HasOne(d => d.ServiceLocation).WithMany(p => p.ServiceRequests)
                .HasForeignKey(d => d.ServiceLocationId)
                .HasConstraintName("FK__ServiceRe__Servi__151B244E");
        });

        modelBuilder.Entity<ServiceRequestImage>(entity =>
        {
            entity.HasKey(e => e.ServiceRequestImageId).HasName("PK__ServiceR__DFB13AEB11646E3B");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.OriginalFileName).HasMaxLength(255);

            entity.HasOne(d => d.ServiceRequest).WithMany(p => p.ServiceRequestImages)
                .HasForeignKey(d => d.ServiceRequestId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ServiceRequestImages_ServiceRequests");
        });

        modelBuilder.Entity<ServiceRequestStatusHistory>(entity =>
        {
            entity.HasKey(e => e.StatusHistoryId).HasName("PK__ServiceR__DB973491C71B373D");

            entity.ToTable("ServiceRequestStatusHistory");

            entity.Property(e => e.ChangedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Note).HasMaxLength(500);

            entity.HasOne(d => d.ChangedByAppUser).WithMany(p => p.ServiceRequestStatusHistories)
                .HasForeignKey(d => d.ChangedByAppUserId)
                .HasConstraintName("FK__ServiceRe__Chang__6477ECF3");

            entity.HasOne(d => d.NewStatus).WithMany(p => p.ServiceRequestStatusHistoryNewStatuses)
                .HasForeignKey(d => d.NewStatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__ServiceRe__NewSt__6383C8BA");

            entity.HasOne(d => d.OldStatus).WithMany(p => p.ServiceRequestStatusHistoryOldStatuses)
                .HasForeignKey(d => d.OldStatusId)
                .HasConstraintName("FK__ServiceRe__OldSt__628FA481");

            entity.HasOne(d => d.ServiceRequest).WithMany(p => p.ServiceRequestStatusHistories)
                .HasForeignKey(d => d.ServiceRequestId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__ServiceRe__Servi__619B8048");
        });

        modelBuilder.Entity<ServiceStatus>(entity =>
        {
            entity.HasKey(e => e.ServiceStatusId).HasName("PK__ServiceS__009D5ED9C9007FDA");

            entity.ToTable("ServiceStatus");

            entity.HasIndex(e => e.StatusName, "UQ__ServiceS__05E7698AC4AEA66D").IsUnique();

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.StatusName).HasMaxLength(50);
        });

        modelBuilder.Entity<ShopBusinessSetting>(entity =>
        {
            entity.HasKey(e => e.ShopBusinessSettingId).HasName("PK__ShopBusi__DD59F52AABD9A9E9");

            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.Area).HasMaxLength(100);
            entity.Property(e => e.BookingNotice).HasMaxLength(500);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.HomeVisitMessage).HasMaxLength(500);
            entity.Property(e => e.OpeningHours).HasMaxLength(200);
            entity.Property(e => e.OwnerName).HasMaxLength(150);
            entity.Property(e => e.PrimaryPhone).HasMaxLength(20);
            entity.Property(e => e.SecondaryPhone).HasMaxLength(20);
            entity.Property(e => e.ShopName).HasMaxLength(150);
            entity.Property(e => e.WhatsAppNumber).HasMaxLength(20);
        });

        modelBuilder.Entity<UserAuthEvent>(entity =>
        {
            entity.HasKey(e => e.UserAuthEventId).HasName("PK__UserAuth__B4D04386A20A8D24");

            entity.HasIndex(e => new { e.AppUserId, e.CreatedAt }, "IX_UserAuthEvents_AppUserId_CreatedAt").IsDescending(false, true);

            entity.HasIndex(e => new { e.Email, e.CreatedAt }, "IX_UserAuthEvents_Email_CreatedAt").IsDescending(false, true);

            entity.HasIndex(e => new { e.EventType, e.CreatedAt }, "IX_UserAuthEvents_EventType_CreatedAt").IsDescending(false, true);

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())", "DF_UserAuthEvents_CreatedAt");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.EventType).HasMaxLength(100);
            entity.Property(e => e.IpAddress).HasMaxLength(100);
            entity.Property(e => e.UserAgent).HasMaxLength(500);

            entity.HasOne(d => d.AppUser).WithMany(p => p.UserAuthEvents)
                .HasForeignKey(d => d.AppUserId)
                .HasConstraintName("FK_UserAuthEvents_AppUsers");
        });

        modelBuilder.Entity<WebsiteVisit>(entity =>
        {
            entity.HasKey(e => e.WebsiteVisitId).HasName("PK__WebsiteV__BFC387B4AC38460C");

            entity.HasIndex(e => new { e.AppUserId, e.CreatedAt }, "IX_WebsiteVisits_AppUserId_CreatedAt").IsDescending(false, true);

            entity.HasIndex(e => e.CreatedAt, "IX_WebsiteVisits_CreatedAt").IsDescending();

            entity.HasIndex(e => new { e.Path, e.CreatedAt }, "IX_WebsiteVisits_Path_CreatedAt").IsDescending(false, true);

            entity.HasIndex(e => new { e.VisitorId, e.CreatedAt }, "IX_WebsiteVisits_VisitorId_CreatedAt").IsDescending(false, true);

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())", "DF_WebsiteVisits_CreatedAt");
            entity.Property(e => e.IpAddress).HasMaxLength(100);
            entity.Property(e => e.Path).HasMaxLength(300);
            entity.Property(e => e.Referrer).HasMaxLength(500);
            entity.Property(e => e.UserAgent).HasMaxLength(500);

            entity.HasOne(d => d.AppUser).WithMany(p => p.WebsiteVisits)
                .HasForeignKey(d => d.AppUserId)
                .HasConstraintName("FK_WebsiteVisits_AppUsers");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
