using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Admin.StoreKnowledge;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Authorize(Policy = AppPolicies.AdminOnly)]
[EnableRateLimiting(RateLimitPolicies.AdminAction)]
[Route("admin/store-knowledge")]
public class AdminStoreKnowledgeController : ControllerBase
{
    private readonly IStoreKnowledgeService _service;

    public AdminStoreKnowledgeController(IStoreKnowledgeService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetArticles([FromQuery] StoreKnowledgeQueryDto query)
    {
        var result = await _service.GetStoreKnowledgeArticlesAsync(query);
        return Ok(result);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _service.GetCategoriesAsync();
        return Ok(categories);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetArticleById([FromRoute] int id)
    {
        var article = await _service.GetByIdAsync(id);
        if (article == null)
        {
            return NotFound(new { message = $"Knowledge article #{id} was not found." });
        }

        return Ok(article);
    }

    [HttpPost]
    public async Task<IActionResult> CreateArticle([FromBody] CreateStoreKnowledgeDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var created = await _service.CreateAsync(dto);

        return CreatedAtAction(nameof(GetArticleById), new { id = created.StoreKnowledgeId }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateArticle([FromRoute] int id, [FromBody] UpdateStoreKnowledgeDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var updated = await _service.UpdateAsync(id, dto);
        if (updated == null)
        {
            return NotFound(new { message = $"Knowledge article #{id} was not found." });
        }

        return Ok(updated);
    }

    [HttpPatch("{id:int}/toggle-active")]
    public async Task<IActionResult> ToggleActive([FromRoute] int id)
    {
        var isActive = await _service.ToggleActiveAsync(id);
        if (!isActive.HasValue)
        {
            return NotFound(new { message = $"Knowledge article #{id} was not found." });
        }

        return Ok(new
        {
            storeKnowledgeId = id,
            isActive = isActive.Value,
            message = isActive.Value ? "Article activated." : "Article deactivated."
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteArticle([FromRoute] int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted)
        {
            return NotFound(new { message = $"Knowledge article #{id} was not found." });
        }

        return Ok(new { message = "Knowledge article deleted successfully." });
    }
}
