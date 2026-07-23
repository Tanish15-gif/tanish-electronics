using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[EnableRateLimiting(RateLimitPolicies.PublicRead)]
[Route("[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    [OutputCache(PolicyName = OutputCachePolicies.PublicProducts)]
    public async Task<IActionResult> GetProducts
    (
        [FromQuery] int? categoryId,
        [FromQuery] int? conditionId,
        [FromQuery] string? search,
        [FromQuery] bool featuredOnly = false
    )
    {
        var products = await _productService.GetProductsAsync(
            categoryId,
            conditionId,
            search,
            featuredOnly);

        return Ok(products);
    }

    [HttpGet("{id:int}")]
    [OutputCache(Duration = 60, Tags = new[] { OutputCachePolicies.ProductsTag })]
    public async Task<IActionResult> GetProductById(int id)
    {
        var product = await _productService.GetProductByIdAsync(id);
        return Ok(product);
    }

    [EnableRateLimiting(RateLimitPolicies.ImageUpload)]
    [HttpPost("{productId:int}/images")]
    [RequestSizeLimit(30_000_000)]
    public async Task<IActionResult> UploadProductImage(int productId, [FromForm(Name = "image")] IFormFile images)
    {
        var result = await _productService.UploadProductImageAsync(productId, images);
        return Ok(result);
    }
}