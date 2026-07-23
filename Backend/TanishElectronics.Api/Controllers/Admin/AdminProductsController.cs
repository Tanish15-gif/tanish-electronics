using Microsoft.AspNetCore.Mvc;
using TanishElectronics.Api.DTOs.Products;
using TanishElectronics.Api.DTOs.Admin.Products;
using TanishElectronics.Api.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using TanishElectronics.Api.Filters;
using TanishElectronics.Api.Constants;
using Microsoft.AspNetCore.RateLimiting;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Authorize(Policy = AppPolicies.AdminOnly)]
[EnableRateLimiting(RateLimitPolicies.AdminAction)]
[Route("admin/products")]
public class AdminProductController : ControllerBase
{
    private readonly IProductService _productService;
    public AdminProductController(IProductService productService)
    {
        _productService = productService;
    }


    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] AdminProductQueryDto query)
    {
        var products = await _productService.GetAdminProductsAsync(query);
        return Ok(products);
    }


    [HttpPost]
    public async Task<IActionResult> Create(CreateProductDto dto)
    {
        var result = await _productService.CreateProductAsync(dto);
        return Ok(result);
    }


    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var products = await _productService.GetAdminProductByIdAsync(id);
        return Ok(products);
    }


    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateProductDto dto)
    {
        await _productService.UpdateProductAsync(id, dto);
        return Ok(new
        {
            message = "Product Updated SuccessFully"
        });
    }


    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _productService.DeleteProductAsync(id);
        return Ok(new
        {
            message = "Product Deleted SuccessFully"
        });
    }
}