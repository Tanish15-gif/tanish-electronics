using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Admin.StoreKnowledge;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;

namespace TanishElectronics.Api.Repositories;

public class StoreKnowledgeRepository : IStoreKnowledgeRepository
{
    private readonly TanishElectronicsDbContext _dbContext;

    public StoreKnowledgeRepository(TanishElectronicsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResultDto<StoreKnowledgeItemDto>> GetStoreKnowledgeArticlesAsync(StoreKnowledgeQueryDto query)
    {
        var q = _dbContext.StoreKnowledges.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            q = q.Where(a =>
                a.Title.ToLower().Contains(search) ||
                a.Content.ToLower().Contains(search) ||
                (a.Tags != null && a.Tags.ToLower().Contains(search))
            );
        }

        if (!string.IsNullOrWhiteSpace(query.Category) && query.Category != "All")
        {
            q = q.Where(a => a.Category == query.Category.Trim());
        }

        if (query.IsActive.HasValue)
        {
            q = q.Where(a => a.IsActive == query.IsActive.Value);
        }

        var totalRecords = await q.CountAsync();

        var pageNumber = Math.Max(query.PageNumber, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var totalPages = (int)Math.Ceiling((double)totalRecords / pageSize);

        var items = await q
            .OrderByDescending(a => a.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new StoreKnowledgeItemDto
            {
                StoreKnowledgeId = a.StoreKnowledgeId,
                Title = a.Title,
                Category = a.Category,
                Content = a.Content,
                Tags = a.Tags,
                IsActive = a.IsActive,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt
            })
            .ToListAsync();

        return new PagedResultDto<StoreKnowledgeItemDto>
        {
            Items = items,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalRecords = totalRecords,
            TotalPages = totalPages
        };
    }

    public async Task<List<string>> GetCategoriesAsync()
    {
        return await _dbContext.StoreKnowledges
            .AsNoTracking()
            .Select(a => a.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();
    }

    public async Task<StoreKnowledgeItemDto?> GetByIdAsync(int id)
    {
        var entity = await _dbContext.StoreKnowledges
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.StoreKnowledgeId == id);

        if (entity == null) return null;

        return new StoreKnowledgeItemDto
        {
            StoreKnowledgeId = entity.StoreKnowledgeId,
            Title = entity.Title,
            Category = entity.Category,
            Content = entity.Content,
            Tags = entity.Tags,
            IsActive = entity.IsActive,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }

    public async Task<StoreKnowledgeItemDto> CreateAsync(CreateStoreKnowledgeDto dto)
    {
        var entity = new StoreKnowledge
        {
            Title = dto.Title.Trim(),
            Category = dto.Category.Trim(),
            Content = dto.Content.Trim(),
            Tags = dto.Tags?.Trim(),
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.StoreKnowledges.Add(entity);
        await _dbContext.SaveChangesAsync();

        return new StoreKnowledgeItemDto
        {
            StoreKnowledgeId = entity.StoreKnowledgeId,
            Title = entity.Title,
            Category = entity.Category,
            Content = entity.Content,
            Tags = entity.Tags,
            IsActive = entity.IsActive,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }

    public async Task<StoreKnowledgeItemDto?> UpdateAsync(int id, UpdateStoreKnowledgeDto dto)
    {
        var entity = await _dbContext.StoreKnowledges.FirstOrDefaultAsync(a => a.StoreKnowledgeId == id);
        if (entity == null) return null;

        entity.Title = dto.Title.Trim();
        entity.Category = dto.Category.Trim();
        entity.Content = dto.Content.Trim();
        entity.Tags = dto.Tags?.Trim();
        entity.IsActive = dto.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return new StoreKnowledgeItemDto
        {
            StoreKnowledgeId = entity.StoreKnowledgeId,
            Title = entity.Title,
            Category = entity.Category,
            Content = entity.Content,
            Tags = entity.Tags,
            IsActive = entity.IsActive,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }

    public async Task<bool?> ToggleActiveAsync(int id)
    {
        var entity = await _dbContext.StoreKnowledges.FirstOrDefaultAsync(a => a.StoreKnowledgeId == id);
        if (entity == null) return null;

        entity.IsActive = !entity.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        return entity.IsActive;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _dbContext.StoreKnowledges.FirstOrDefaultAsync(a => a.StoreKnowledgeId == id);
        if (entity == null) return false;

        _dbContext.StoreKnowledges.Remove(entity);
        await _dbContext.SaveChangesAsync();

        return true;
    }
}