using TanishElectronics.Api.DTOs.Products;
using TanishElectronics.Api.DTOs.Admin.Products;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.Constants;
using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Delegates;
using TanishElectronics.Api.Interfaces.Events;
using TanishElectronics.Api.Events.Products;
using TanishElectronics.Api.DTOs.Common;

namespace TanishElectronics.Api.Services;

public class ProductService : IProductService
{
    private event ProductCreatedEventHandler? ProductCreated;
    private readonly IProductRepository _repository;
    private readonly IWebHostEnvironment _environment;
    private readonly TanishElectronicsDbContext _dbContext;
    private readonly IProductCreatedAnnouncementHandler _announcementHandler;
    private readonly IPublicOutputCacheInvalidator _outputCacheInvalidator;
    private readonly ILogger<ProductService> _logger;
    private readonly INotificationRealtimeNotifier _notificationNotifier;
    public ProductService
    (
        IProductRepository repository,
        IWebHostEnvironment environment,
        TanishElectronicsDbContext dbContext,
        IProductCreatedAnnouncementHandler announcementHandler,
        IPublicOutputCacheInvalidator outputCacheInvalidator,
        ILogger<ProductService> logger,
        INotificationRealtimeNotifier notificationNotifier
    )
    {
        _repository = repository;
        _environment = environment;
        _dbContext = dbContext;
        _announcementHandler = announcementHandler;
        ProductCreated += _announcementHandler.HandleAsync;
        _outputCacheInvalidator = outputCacheInvalidator;
        _logger = logger;
        _notificationNotifier = notificationNotifier;
    }

    public async Task<ProductCreatedDto> CreateProductAsync(CreateProductDto dto)
    {
        ValidateCreateProduct(dto);

        var categoryExists = await _repository.ProductCategoryExistsAsync(
            dto.ProductCategoryId
        );

        if (!categoryExists)
        {
            throw new InvalidOperationException("Selected product category was not found.");
        }

        var conditionExists = await _repository.ProductConditionExistsAsync(
            dto.ProductConditionId
        );

        if (!conditionExists)
        {
            throw new InvalidOperationException("Selected product condition was not found.");
        }

        var product = new Product
        {
            ProductCategoryId = dto.ProductCategoryId,
            ProductConditionId = dto.ProductConditionId,

            ProductName = dto.ProductName.Trim(),

            Brand = string.IsNullOrWhiteSpace(dto.Brand)
                ? null
                : dto.Brand.Trim(),

            ModelName = string.IsNullOrWhiteSpace(dto.ModelName)
                ? null
                : dto.ModelName.Trim(),

            Description = string.IsNullOrWhiteSpace(dto.Description)
                ? null
                : dto.Description.Trim(),

            Price = dto.Price,
            StockQuantity = dto.StockQuantity,

            IsAvailable = dto.IsAvailable,
            IsFeatured = dto.IsFeatured,

            CreatedAt = DateTime.Now
        };

        await _repository.AddProductAsync(product);
        await _repository.SaveChangesAsync();

        await HandleLowStockNotificationAsync(product);
        await _repository.SaveChangesAsync();

        try
        {
            if (ProductCreated != null)
            {
                await ProductCreated.Invoke(new ProductCreatedEventArgs
                {
                    ProductId = product.ProductId,
                    ProductName = product.ProductName,
                    Brand = product.Brand,
                    ModelName = product.ModelName,
                    Price = product.Price,
                    StockQuantity = product.StockQuantity,

                    CreateAnnouncement = dto.CreateAnnouncement,
                    AnnouncementTitle = dto.AnnouncementTitle,
                    AnnouncementMessage = dto.AnnouncementMessage,
                    AnnouncementPriority = dto.AnnouncementPriority,
                    AnnouncementEndAt = dto.AnnouncementEndAt
                });
            }
        }
        catch
        {
        }

        await _outputCacheInvalidator.EvictProductsAsync();

        return new ProductCreatedDto
        {
            ProductId = product.ProductId,
            ProductName = product.ProductName,
            Message = "Product Created SuccessFully"
        };
    }

    public async Task<PagedResultDto<AdminProductListItemDto>> GetAdminProductsAsync(AdminProductQueryDto query)
    {
        return await _repository.GetAdminProductsAsync(query);
    }

    public async Task<ProductDetailsDto> GetProductByIdAsync(int productId)
    {
        var product = await _repository.GetProductByIdAsync(productId);
        if (product == null)
        {
            throw new KeyNotFoundException("Product Not Found");
        }
        return product;
    }

    public async Task<List<ProductsListItemDto>> GetProductsAsync(int? categoryId, int? conditionId, string? search, bool featuredOnly)
    {
        _logger.LogInformation(
        "DB HIT: Public products loaded. CategoryId: {CategoryId}, ConditionId: {ConditionId}, Search: {Search}, FeaturedOnly: {FeaturedOnly}",
        categoryId,
        conditionId,
        search,
        featuredOnly
    );
        return await _repository.GetProductsAsync(categoryId, conditionId, search, featuredOnly);
    }
    private static void ValidateCreateProduct(CreateProductDto dto)
    {
        if (dto.ProductCategoryId <= 0)
        {
            throw new InvalidOperationException("Product category is required.");
        }

        if (dto.ProductConditionId <= 0)
        {
            throw new InvalidOperationException("Product condition is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.ProductName))
        {
            throw new InvalidOperationException("Product name is required.");
        }

        if (dto.Price < 0)
        {
            throw new InvalidOperationException("Price cannot be negative.");
        }

        if (dto.StockQuantity < 0)
        {
            throw new InvalidOperationException("Stock quantity cannot be negative.");
        }
        if (dto.AnnouncementPriority < 1 || dto.AnnouncementPriority > 4)
        {
            throw new InvalidOperationException("Announcement priority must be between 1 and 4.");
        }
        if
        (
            dto.CreateAnnouncement &&
            dto.AnnouncementEndAt != null &&
            dto.AnnouncementEndAt <= DateTime.Now
        )
        {
            throw new InvalidOperationException("Announcement end date must be in the future.");
        }
    }

    public async Task<AdminProductDetailsDto> GetAdminProductByIdAsync(int productId)
    {
        var products = await _repository.GetAdminProductByIdAsync(productId);

        if (products == null)
        {
            throw new KeyNotFoundException("Product Not FOund");
        }
        return products;
    }

    public async Task UpdateProductAsync(int productId, UpdateProductDto dto)
    {
        ValidateUpdateProduct(dto);
        var categoryExists = await _repository.ProductCategoryExistsAsync(dto.ProductCategoryId);
        if (!categoryExists)
        {
            throw new InvalidOperationException("Selected product category was not found.");
        }
        var conditionExists = await _repository.ProductConditionExistsAsync(
        dto.ProductConditionId);

        if (!conditionExists)
        {
            throw new InvalidOperationException("Selected product condition was not found.");
        }

        var product = await _repository.GetProductEntityByIdAsync(productId);

        if (product == null)
        {
            throw new KeyNotFoundException("Product not found.");
        }

        product.ProductCategoryId = dto.ProductCategoryId;
        product.ProductConditionId = dto.ProductConditionId;

        product.ProductName = dto.ProductName.Trim();

        product.Brand = string.IsNullOrWhiteSpace(dto.Brand) ? null : dto.Brand.Trim();
        product.ModelName = string.IsNullOrWhiteSpace(dto.ModelName)
            ? null
            : dto.ModelName.Trim();

        product.Description = string.IsNullOrWhiteSpace(dto.Description)
            ? null
            : dto.Description.Trim();

        product.Price = dto.Price;
        product.StockQuantity = dto.StockQuantity;

        product.IsAvailable = dto.IsAvailable;
        product.IsFeatured = dto.IsFeatured;

        product.UpdatedAt = DateTime.Now;

        await _repository.SaveChangesAsync();
        await HandleLowStockNotificationAsync(product);
        await _repository.SaveChangesAsync();
        await _outputCacheInvalidator.EvictProductsAsync();
    }
    private static void ValidateUpdateProduct(UpdateProductDto dto)
    {
        if (dto.ProductCategoryId <= 0)
        {
            throw new InvalidOperationException("Product category is required.");
        }

        if (dto.ProductConditionId <= 0)
        {
            throw new InvalidOperationException("Product condition is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.ProductName))
        {
            throw new InvalidOperationException("Product name is required.");
        }

        if (dto.Price < 0)
        {
            throw new InvalidOperationException("Price cannot be negative.");
        }

        if (dto.StockQuantity < 0)
        {
            throw new InvalidOperationException("Stock quantity cannot be negative.");
        }
    }

    public async Task DeleteProductAsync(int productId)
    {
        var product = await _repository.GetProductEntityByIdAsync(productId);
        if (product == null)
        {
            throw new KeyNotFoundException("Product not found.");
        }
        product.UpdatedAt = DateTime.Now;
        product.DeletedAt = DateTime.Now;

        var webRootPath = _environment.WebRootPath;

        if (string.IsNullOrWhiteSpace(webRootPath))
        {
            webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }

        var productUploadFolder = Path.Combine(
            webRootPath,
            "uploads",
            "products",
            productId.ToString()
        );

        if (Directory.Exists(productUploadFolder))
        {
            Directory.Delete(productUploadFolder, true);
        }

        await _repository.SaveChangesAsync();
        await _outputCacheInvalidator.EvictProductsAsync();
    }

    public async Task<UploadProductImageResultDto> UploadProductImageAsync(int productId, IFormFile image)
    {
        var product = await _repository.GetProductEntityByIdAsync(productId);

        if (product == null)
        {
            throw new KeyNotFoundException("Product not found");
        }

        if (image == null || image.Length == 0)
        {
            throw new InvalidOperationException("Please upload product image.");
        }

        string[] allowedContentTypes =
        {
        "image/jpeg",
        "image/png",
        "image/webp"
    };

        if (!allowedContentTypes.Contains(image.ContentType))
        {
            throw new InvalidOperationException("Only JPG, PNG and WEBP images are allowed.");
        }

        const long maxFileSize = 5 * 1024 * 1024;

        if (image.Length > maxFileSize)
        {
            throw new InvalidOperationException("Product image must be less than 5MB.");
        }

        var webRootPath = _environment.WebRootPath;

        if (string.IsNullOrWhiteSpace(webRootPath))
        {
            webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }

        var uploadFolder = Path.Combine(
            webRootPath,
            "uploads",
            "products",
            productId.ToString()
        );

        Directory.CreateDirectory(uploadFolder);

        var extension = Path.GetExtension(image.FileName).ToLowerInvariant();

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };

        if (!allowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException("Only JPG, PNG and WEBP images are allowed.");
        }

        var safeFileName = $"{Guid.NewGuid()}{extension}";

        var filePath = Path.Combine(uploadFolder, safeFileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await image.CopyToAsync(stream);
        }

        var imageUrl = $"/uploads/products/{productId}/{safeFileName}";

        var primaryImage = await _repository.GetPrimaryProductImageAsync(productId);

        if (primaryImage == null)
        {
            var productImage = new ProductImage
            {
                ProductId = product.ProductId,
                ImageUrl = imageUrl,
                AltText = product.ProductName,
                IsPrimary = true,
                SortOrder = 1
            };

            await _repository.AddProductImageAsync(productImage);
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(primaryImage.ImageUrl))
            {
                var oldOImagePath = Path.Combine(
                    webRootPath,
                    primaryImage.ImageUrl
                        .TrimStart('/')
                        .Replace("/", Path.DirectorySeparatorChar.ToString())
                );
                if (File.Exists(oldOImagePath))
                {
                    File.Delete(oldOImagePath);
                }
            }
            primaryImage.ImageUrl = imageUrl;
            primaryImage.AltText = product.ProductName;
            primaryImage.IsPrimary = true;
            primaryImage.SortOrder = 1;
        }

        product.PrimaryImageUrl = imageUrl;
        product.UpdatedAt = DateTime.Now;

        await _repository.SaveChangesAsync();

        await _outputCacheInvalidator.EvictProductsAsync();

        return new UploadProductImageResultDto
        {
            Message = "Product image uploaded successfully.",
            ImageUrl = imageUrl
        };
    }
    private async Task HandleLowStockNotificationAsync(Product product)
    {
        if (product.DeletedAt != null)
        {
            return;
        }
        if (!product.IsAvailable)
        {
            return;
        }

        if (product.StockQuantity > ProductStockConstants.LowStockThreshold)
        {
            var oldLowStockNotifications = await _dbContext.AdminNotifications
                .Where(notification =>
                    notification.ProductId == product.ProductId &&
                    notification.NotificationType == "LowStock" &&
                    notification.IsRead == false)
                .ToListAsync();

            foreach (var notification in oldLowStockNotifications)
            {
                notification.IsRead = true;
            }

            return;
        }

        var existingUnreadNotification = await _dbContext.AdminNotifications
            .AnyAsync(notification =>
                notification.ProductId == product.ProductId &&
                notification.NotificationType == "LowStock" &&
                notification.IsRead == false);

        if (existingUnreadNotification)
        {
            return;
        }

        var title = product.StockQuantity <= 0
            ? "Product out of stock"
            : "Low stock alert";

        var message = product.StockQuantity <= 0
            ? $"{product.ProductName} is out of stock."
            : $"{product.ProductName} has only {product.StockQuantity} item(s) left.";

        var adminNotification = new AdminNotification
        {
            ProductId = product.ProductId,
            Title = title,
            Message = message,
            NotificationType = "LowStock",
            IsRead = false,
            CreatedAt = DateTime.Now
        };

        await _dbContext.AdminNotifications.AddAsync(adminNotification);
        await _dbContext.SaveChangesAsync();

        await _notificationNotifier.NotifyAdminsAsync(new DTOs.Admin.Notifications.GetAdminNotificationDto
        {
            AdminNotificationId = adminNotification.AdminNotificationId,
            ProductId = adminNotification.ProductId,
            Title = adminNotification.Title,
            Message = adminNotification.Message,
            NotificationType = adminNotification.NotificationType,
            IsRead = false,
            CreatedAt = adminNotification.CreatedAt
        });
    }
}