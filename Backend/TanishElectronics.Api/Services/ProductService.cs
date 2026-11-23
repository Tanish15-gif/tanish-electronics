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
    public async Task<List<ProductsListItemDto>> GetRecommendationsAsync(int productId, int limit = 4)
    {
        var current = await GetProductByIdAsync(productId);
        var candidates = await _repository.GetProductsAsync(null, null, null, false);
        return RankRecommendations(current, candidates, limit);
    }

    // The details page and chatbot share these rules. Brand affinity is a hint,
    // never proof of model compatibility; unverified electrical parts are excluded.
    internal static List<ProductsListItemDto> RankRecommendations(
        ProductDetailsDto current, IEnumerable<ProductsListItemDto> candidates, int limit)
    {
        var currentType = RecommendationProductType(current.CategoryName, current.ProductName);
        var currentBrand = RecommendationBrand(current.Brand, current.ProductName);
        return candidates
            .Where(p => p.ProductId != current.ProductId && p.IsAvailable && p.StockQuantity > 0)
            .Select(p => (Product: p, Match: RecommendationMatch(current, currentType, currentBrand, p)))
            .Where(entry => entry.Match.Score > 0)
            .OrderByDescending(entry => entry.Match.Score)
            .ThenBy(entry => Math.Abs(entry.Product.Price - current.Price))
            .ThenByDescending(entry => entry.Product.IsFeatured)
            .ThenByDescending(entry => entry.Product.ProductId)
            .Take(Math.Clamp(limit, 1, 8))
            .Select(entry =>
            {
                entry.Product.RecommendationKind = entry.Match.Kind;
                entry.Product.RecommendationReason = entry.Match.Reason;
                return entry.Product;
            })
            .ToList();
    }

    private static (int Score, string Kind, string Reason) RecommendationMatch(
        ProductDetailsDto current, string currentType, string currentBrand, ProductsListItemDto candidate)
    {
        var candidateType = RecommendationProductType(candidate.CategoryName, candidate.ProductName);
        var candidateBrand = RecommendationBrand(candidate.Brand, candidate.ProductName);
        var brandMatches = currentBrand.Length > 0 &&
            (currentBrand == candidateBrand || MentionsRecommendationTerm(candidate.ProductName, currentBrand) ||
             (candidateBrand.Length > 0 && MentionsRecommendationTerm(current.ProductName, candidateBrand)));
        var modelMatches = !string.IsNullOrWhiteSpace(current.ModelName) &&
            (string.Equals(current.ModelName.Trim(), candidate.ModelName?.Trim(), StringComparison.OrdinalIgnoreCase) ||
             MentionsRecommendationTerm(candidate.ProductName, current.ModelName.Trim()));
        var sameCategory = !string.IsNullOrWhiteSpace(current.CategoryName) &&
            string.Equals(current.CategoryName.Trim(), candidate.CategoryName.Trim(), StringComparison.OrdinalIgnoreCase);
        var sameType = currentType == candidateType && (currentType != "other" || sameCategory);
        var conditionBonus = string.Equals(current.ConditionName, candidate.ConditionName, StringComparison.OrdinalIgnoreCase) ? 5 : 0;
        var priceBonus = current.Price > 0 ? (int)(20m * (1m - Math.Min(1m, Math.Abs(candidate.Price - current.Price) / current.Price))) : 0;

        if (sameType)
        {
            // A different TV brand is a valid alternative. Remotes and parts need
            // explicit brand/model evidence, even when advertised as universal.
            if (currentType == "remote" && !brandMatches) return default;
            if (currentType is "adapter" or "stand" or "accessory" && !(brandMatches && modelMatches)) return default;
            return (100 + (brandMatches ? 25 : 0) + (modelMatches ? 30 : 0) + conditionBonus + priceBonus,
                "alternative", currentType == "tv" ? "Another TV to compare on price, size and condition."
                    : currentType == "remote" ? "A remote for the same brand. Confirm your device model before buying."
                    : "A similar item to compare. Confirm specifications with the shop.");
        }

        if (currentType == "tv" && candidateType == "remote" && brandMatches &&
            !MentionsRecommendationTerm(candidate.CategoryName + " " + candidate.ProductName, "ac|air conditioner|set top|set-top|receiver", true))
            return (200 + (modelMatches ? 30 : 0), "accessory", "Listed for this TV brand. Ask the shop to confirm your exact model.");
        if (currentType == "remote" && candidateType == "tv" && brandMatches &&
            !MentionsRecommendationTerm(current.CategoryName + " " + current.ProductName, "ac|air conditioner|set top|set-top|receiver", true))
            return (160 + (modelMatches ? 30 : 0), "device", "A TV from the same brand. Remote compatibility needs a model check.");
        if (currentType == "tv" && candidateType is "adapter" or "stand" or "cable" or "accessory" && brandMatches && modelMatches)
            return (180, "accessory", "Mentions this brand and model. Confirm fit and electrical specifications with the shop.");
        return default;
    }

    private static string RecommendationProductType(string category, string name)
    {
        var text = category + " " + name;
        if (MentionsRecommendationTerm(text, "remotes?|remote controls?", true)) return "remote";
        if (MentionsRecommendationTerm(text, "adapters?|adaptors?|power supplies|power supply|chargers?", true)) return "adapter";
        if (MentionsRecommendationTerm(text, "cables?|cords?", true)) return "cable";
        if (MentionsRecommendationTerm(text, "stands?|mounts?|brackets?", true)) return "stand";
        if (MentionsRecommendationTerm(text, "accessories|accessory|parts?|spares?", true)) return "accessory";
        if (MentionsRecommendationTerm(text, "tv|tvs|television|televisions|qled|oled", true)) return "tv";
        return "other";
    }

    private static string RecommendationBrand(string? brand, string name)
    {
        var value = (brand ?? "").Trim().ToLowerInvariant();
        if (value.Length > 0 && value is not ("general" or "generic" or "remote" or "accessories" or "unknown" or "universal" or "n/a"))
            return value;
        string[] knownBrands = ["vu", "lg", "samsung", "sony", "sansui", "kodak", "croma", "mi", "xiaomi", "oneplus", "tcl", "panasonic", "philips", "haier", "videocon", "onida", "bpl", "toshiba", "sharp", "micromax", "realme", "intex", "lloyd", "iffalcon", "hisense", "motorola", "nxt", "tata sky", "airtel", "dish tv", "d2h"];
        return knownBrands.FirstOrDefault(b => MentionsRecommendationTerm(name, b)) ?? "";
    }

    private static bool MentionsRecommendationTerm(string text, string term, bool pattern = false)
    {
        var expression = @"(?<![\p{L}\p{N}])(?:" + (pattern ? term : System.Text.RegularExpressions.Regex.Escape(term)) + @")(?![\p{L}\p{N}])";
        return System.Text.RegularExpressions.Regex.IsMatch(text, expression,
            System.Text.RegularExpressions.RegexOptions.IgnoreCase | System.Text.RegularExpressions.RegexOptions.CultureInvariant,
            TimeSpan.FromMilliseconds(100));
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
        var product = await _repository.GetProductEntityByIdAsync(productId)
            ?? throw new KeyNotFoundException("Product not found.");
        var cleaned = await TanishElectronics.Api.Helpers.ImageUploadSecurity.SanitizeAsync(image);
        var root = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var folder = Path.Combine(root, "uploads", "products", productId.ToString());
        Directory.CreateDirectory(folder);
        var name = $"{Guid.NewGuid():N}.png";
        var path = Path.Combine(folder, name);
        var url = $"/uploads/products/{productId}/{name}";
        var primary = await _repository.GetPrimaryProductImageAsync(productId);
        var oldUrl = primary?.ImageUrl;
        try
        {
            await File.WriteAllBytesAsync(path, cleaned);
            if (primary == null)
                await _repository.AddProductImageAsync(new ProductImage
                { ProductId = productId, ImageUrl = url, AltText = product.ProductName, IsPrimary = true, SortOrder = 1 });
            else
            { primary.ImageUrl = url; primary.AltText = product.ProductName; primary.IsPrimary = true; primary.SortOrder = 1; }
            product.PrimaryImageUrl = url;
            product.UpdatedAt = DateTime.UtcNow;
            await _repository.SaveChangesAsync();
        }
        catch
        { if (File.Exists(path)) File.Delete(path); throw; }
        // Delete the old file only after committing its replacement, and only in this product folder.
        if (oldUrl?.StartsWith($"/uploads/products/{productId}/", StringComparison.Ordinal) == true)
        {
            var oldName = oldUrl.Split('/').Last();
            if (oldName == Path.GetFileName(oldName) && !oldName.Contains('\\'))
            {
                var oldPath = Path.Combine(folder, oldName);
                try { if (File.Exists(oldPath)) File.Delete(oldPath); }
                catch (IOException ex) { _logger.LogWarning(ex, "Previous product image could not be removed."); }
            }
        }
        await _outputCacheInvalidator.EvictProductsAsync();
        return new UploadProductImageResultDto { Message = "Product image uploaded successfully.", ImageUrl = url };
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