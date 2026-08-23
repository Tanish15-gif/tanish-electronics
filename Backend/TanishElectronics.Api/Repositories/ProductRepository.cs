using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Products;
using TanishElectronics.Api.DTOs.Admin.Products;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.DTOs.Common;

namespace TanishElectronics.Api.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly TanishElectronicsDbContext _dbContext;
    public ProductRepository(TanishElectronicsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddProductAsync(Product product)
    {
        await _dbContext.Products.AddAsync(product);
    }

    public async Task AddProductImageAsync(ProductImage productImage)
    {
        await _dbContext.ProductImages.AddAsync(productImage);
    }

    public async Task<AdminProductDetailsDto?> GetAdminProductByIdAsync(int productId)
    {
        return await _dbContext.Products
            .Where(product =>
                product.ProductId == productId &&
                product.DeletedAt == null)
            .Select(product => new AdminProductDetailsDto
            {
                ProductId = product.ProductId,

                ProductCategoryId = product.ProductCategoryId,
                ProductConditionId = product.ProductConditionId,

                ProductName = product.ProductName,

                Brand = product.Brand,
                ModelName = product.ModelName,
                Description = product.Description,

                Price = product.Price,
                StockQuantity = product.StockQuantity,

                IsAvailable = product.IsAvailable,
                IsFeatured = product.IsFeatured,

                PrimaryImageUrl = _dbContext.ProductImages
                    .Where(image => image.ProductId == product.ProductId)
                    .OrderByDescending(image => image.IsPrimary)
                    .ThenBy(image => image.SortOrder)
                    .Select(image => image.ImageUrl)
                    .FirstOrDefault(),

                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<PagedResultDto<AdminProductListItemDto>> GetAdminProductsAsync(AdminProductQueryDto query)
    {
        query ??= new AdminProductQueryDto();

        query.PageNumber = Math.Max(query.PageNumber, 1);
        query.PageSize = Math.Clamp(query.PageSize, 1, 50);

        var productQuery =
            from product in _dbContext.Products.AsNoTracking()
            join category in _dbContext.ProductCategories.AsNoTracking()
                on product.ProductCategoryId equals category.ProductCategoryId
            join condition in _dbContext.ProductConditions.AsNoTracking()
                on product.ProductConditionId equals condition.ProductConditionId
            where product.DeletedAt == null
            select new
            {
                product,
                category,
                condition
            };

        if (query.CategoryId.HasValue && query.CategoryId.Value > 0)
        {
            int selectedCategoryId = query.CategoryId.Value;

            productQuery = productQuery.Where(x =>
                x.product.ProductCategoryId == selectedCategoryId
            );
        }
        if (query.ConditionId.HasValue && query.ConditionId.Value > 0)
        {
            int selectedConditionId = query.ConditionId.Value;

            productQuery = productQuery.Where(x =>
                x.product.ProductConditionId == selectedConditionId
            );
        }
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            string searchText = query.Search.Trim();

            productQuery = productQuery.Where(x =>
                x.product.ProductName.Contains(searchText) ||
                (
                    x.product.Brand != null &&
                    x.product.Brand.Contains(searchText)
                ) ||
                (
                    x.product.ModelName != null &&
                    x.product.ModelName.Contains(searchText)
                )
            );
        }

        int totalRecords = await productQuery.CountAsync();

        int totalPages = (int)Math.Ceiling(
            totalRecords / (double)query.PageSize
        );

        var items = await productQuery
            .OrderByDescending(x => x.product.CreatedAt)
            .Skip((query.PageNumber - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(x => new AdminProductListItemDto
            {
                ProductId = x.product.ProductId,
                ProductName = x.product.ProductName,

                CategoryName = x.category.CategoryName,
                ConditionName = x.condition.ConditionName,

                Brand = x.product.Brand,
                ModelName = x.product.ModelName,

                Price = x.product.Price,
                StockQuantity = x.product.StockQuantity,

                IsAvailable = x.product.IsAvailable,
                IsFeatured = x.product.IsFeatured,

                PrimaryImageUrl = _dbContext.ProductImages
                    .Where(image =>
                        image.ProductId == x.product.ProductId
                    )
                    .OrderByDescending(image => image.IsPrimary)
                    .ThenBy(image => image.SortOrder)
                    .Select(image => image.ImageUrl)
                    .FirstOrDefault(),

                CreatedAt = x.product.CreatedAt
            })
            .ToListAsync();

        return new PagedResultDto<AdminProductListItemDto>
        {
            Items = items,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            TotalRecords = totalRecords,
            TotalPages = totalPages
        };
    }

    public async Task<ProductImage?> GetPrimaryProductImageAsync(int productId)
    {
        return await _dbContext.ProductImages
            .Where(image => image.ProductId == productId)
            .OrderByDescending(image => image.IsPrimary)
            .ThenBy(image => image.SortOrder)
            .FirstOrDefaultAsync();
    }

    public async Task<Product?> GetProductEntityByIdAsync(int productId)
    {
        return await _dbContext.Products
            .FirstOrDefaultAsync(product =>
                product.ProductId == productId && product.DeletedAt == null);
    }

    public async Task<ProductDetailsDto?> GetProductByIdAsync(int productId)
    {
        var productDetails = await (
            from product in _dbContext.Products
            join category in _dbContext.ProductCategories
                on product.ProductCategoryId equals category.ProductCategoryId
            join condition in _dbContext.ProductConditions
                on product.ProductConditionId equals condition.ProductConditionId
            where product.ProductId == productId
                  && product.DeletedAt == null
                  && product.IsAvailable
            select new ProductDetailsDto
            {
                ProductId = product.ProductId,
                ProductName = product.ProductName,
                CategoryName = category.CategoryName,
                ConditionName = condition.ConditionName,
                Brand = product.Brand,
                ModelName = product.ModelName,
                Description = product.Description,
                Price = product.Price,
                PrimaryImageUrl = product.PrimaryImageUrl,
                StockQuantity = product.StockQuantity,
                IsAvailable = product.IsAvailable,
                IsFeatured = product.IsFeatured
            }
        ).FirstOrDefaultAsync();

        if (productDetails == null)
        {
            return null;
        }
        productDetails.ImageUrls = await _dbContext.ProductImages
            .Where(image => image.ProductId == productId)
            .OrderByDescending(image => image.IsPrimary)
            .ThenBy(image => image.SortOrder)
            .Select(image => image.ImageUrl)
            .ToListAsync();

        return productDetails;
    }



    public async Task<List<ProductsListItemDto>> GetProductsAsync(int? categoryId, int? conditionId, string? search, bool featuredOnly)
    {
        var query =
            from product in _dbContext.Products
            join category in _dbContext.ProductCategories
                on product.ProductCategoryId equals category.ProductCategoryId
            join condition in _dbContext.ProductConditions
                on product.ProductConditionId equals condition.ProductConditionId
            where product.DeletedAt == null
                  && product.IsAvailable
            select new
            {
                product,
                category,
                condition
            };
        if (categoryId.HasValue)
        {
            query = query.Where(x => x.product.ProductCategoryId == categoryId.Value);
        }
        if (conditionId.HasValue)
        {
            query = query.Where(x => x.product.ProductConditionId == conditionId.Value);
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchText = search.Trim();

            query = query.Where(x =>
                x.product.ProductName.Contains(searchText) ||
                (x.product.Brand != null && x.product.Brand.Contains(searchText)) ||
                (x.product.ModelName != null && x.product.ModelName.Contains(searchText)));
        }

        if (featuredOnly)
        {
            query = query.Where(x => x.product.IsFeatured);
        }
        return await query
            .OrderByDescending(x => x.product.CreatedAt)
            .Select(x => new ProductsListItemDto
            {
                ProductId = x.product.ProductId,
                ProductName = x.product.ProductName,
                CategoryName = x.category.CategoryName,
                ConditionName = x.condition.ConditionName,
                Brand = x.product.Brand,
                ModelName = x.product.ModelName,
                Price = x.product.Price,
                StockQuantity = x.product.StockQuantity,
                IsAvailable = x.product.IsAvailable,
                IsFeatured = x.product.IsFeatured,
                PrimaryImageUrl = _dbContext.ProductImages
                    .Where(image => image.ProductId == x.product.ProductId)
                    .OrderByDescending(image => image.IsPrimary)
                    .ThenBy(image => image.SortOrder)
                    .Select(image => image.ImageUrl)
                    .FirstOrDefault()
            })
            .ToListAsync();
    }

    public async Task<bool> ProductCategoryExistsAsync(int categoryId)
    {
        return await _dbContext.ProductCategories
            .AnyAsync(category => category.ProductCategoryId == categoryId && category.IsActive);
    }

    public async Task<bool> ProductConditionExistsAsync(int conditionId)
    {
        return await _dbContext.ProductConditions
            .AnyAsync(condition => condition.ProductConditionId == conditionId);
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}