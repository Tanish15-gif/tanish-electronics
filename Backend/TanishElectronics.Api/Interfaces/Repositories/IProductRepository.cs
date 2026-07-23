using TanishElectronics.Api.DTOs.Products;
using TanishElectronics.Api.DTOs.Admin.Products;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.DTOs.Common;

namespace TanishElectronics.Api.Interfaces.Repositories;

public interface IProductRepository
{
    Task<List<ProductsListItemDto>> GetProductsAsync(int? categoryId, int? conditionId, string? search, bool featuredOnly);

    Task<ProductDetailsDto?> GetProductByIdAsync(int productId);

    Task<PagedResultDto<AdminProductListItemDto>> GetAdminProductsAsync(AdminProductQueryDto query);

    Task<bool> ProductCategoryExistsAsync(int categoryId);
    Task<bool> ProductConditionExistsAsync(int conditionId);
    Task AddProductAsync(Product product);
    Task AddProductImageAsync(ProductImage productImage);

    Task<AdminProductDetailsDto?> GetAdminProductByIdAsync(int productId);

    Task<Product?> GetProductEntityByIdAsync(int productId);

    Task<ProductImage?> GetPrimaryProductImageAsync(int productId);
    Task SaveChangesAsync();
}