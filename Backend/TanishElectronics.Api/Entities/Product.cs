using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.Entities;

public partial class Product
{
    public int ProductId { get; set; }

    public int ProductCategoryId { get; set; }

    public int ProductConditionId { get; set; }

    public string ProductName { get; set; } = null!;

    public string? Brand { get; set; }

    public string? ModelName { get; set; }

    public string? Description { get; set; }

    public decimal Price { get; set; }

    public int StockQuantity { get; set; }

    public bool IsAvailable { get; set; }

    public bool IsFeatured { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public string? PrimaryImageUrl { get; set; }

    public virtual ICollection<AdminNotification> AdminNotifications { get; set; } = new List<AdminNotification>();

    public virtual ICollection<Enquiry> Enquiries { get; set; } = new List<Enquiry>();

    public virtual ProductCategory ProductCategory { get; set; } = null!;

    public virtual ProductCondition ProductCondition { get; set; } = null!;

    public virtual ICollection<ProductImage> ProductImages { get; set; } = new List<ProductImage>();
}
