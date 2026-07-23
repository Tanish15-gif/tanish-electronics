using TanishElectronics.Api.DTOs.Admin.Products;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.DTOs.Products;

namespace TanishElectronics.Api.Interfaces.Services;

public interface IProductService
{
    Task<List<ProductsListItemDto>> GetProductsAsync(
        int? categoryId,
        int? conditionId,
        string? search,
        bool featuredOnly);

    Task<ProductDetailsDto> GetProductByIdAsync(int productId);

    Task<PagedResultDto<AdminProductListItemDto>> GetAdminProductsAsync(AdminProductQueryDto query);
    Task<ProductCreatedDto> CreateProductAsync(CreateProductDto dto);

    Task<AdminProductDetailsDto> GetAdminProductByIdAsync(int productId);

    Task UpdateProductAsync(int productId, UpdateProductDto dto);

    Task<UploadProductImageResultDto> UploadProductImageAsync(int productId, IFormFile image);

    Task DeleteProductAsync(int productId);
}