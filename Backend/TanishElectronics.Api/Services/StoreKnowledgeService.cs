using TanishElectronics.Api.DTOs.Admin.StoreKnowledge;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class StoreKnowledgeService : IStoreKnowledgeService
{
    private readonly IStoreKnowledgeRepository _repository;
    private readonly IKnowledgeVectorService _knowledgeVectorService;
    private readonly ILogger<StoreKnowledgeService> _logger;

    public StoreKnowledgeService(
        IStoreKnowledgeRepository repository,
        IKnowledgeVectorService knowledgeVectorService,
        ILogger<StoreKnowledgeService> logger)
    {
        _repository = repository;
        _knowledgeVectorService = knowledgeVectorService;
        _logger = logger;
    }

    public async Task<PagedResultDto<StoreKnowledgeItemDto>> GetStoreKnowledgeArticlesAsync(StoreKnowledgeQueryDto query)
    {
        return await _repository.GetStoreKnowledgeArticlesAsync(query);
    }

    public async Task<List<string>> GetCategoriesAsync()
    {
        return await _repository.GetCategoriesAsync();
    }

    public async Task<StoreKnowledgeItemDto?> GetByIdAsync(int id)
    {
        return await _repository.GetByIdAsync(id);
    }

    public async Task<StoreKnowledgeItemDto> CreateAsync(CreateStoreKnowledgeDto dto)
    {
        var created = await _repository.CreateAsync(dto);

        // Invalidate semantic vector cache so the chatbot immediately knows about the new article
        await _knowledgeVectorService.InvalidateCacheAsync();
        _logger.LogInformation("Store knowledge article #{Id} created: {Title}", created.StoreKnowledgeId, created.Title);

        return created;
    }

    public async Task<StoreKnowledgeItemDto?> UpdateAsync(int id, UpdateStoreKnowledgeDto dto)
    {
        var updated = await _repository.UpdateAsync(id, dto);
        if (updated != null)
        {
            // Invalidate semantic vector cache so updates are applied immediately
            await _knowledgeVectorService.InvalidateCacheAsync();
            _logger.LogInformation("Store knowledge article #{Id} updated: {Title}", updated.StoreKnowledgeId, updated.Title);
        }

        return updated;
    }

    public async Task<bool?> ToggleActiveAsync(int id)
    {
        var activeStatus = await _repository.ToggleActiveAsync(id);
        if (activeStatus.HasValue)
        {
            // Invalidate semantic vector cache so deactivated/activated articles update in search
            await _knowledgeVectorService.InvalidateCacheAsync();
            _logger.LogInformation("Store knowledge article #{Id} active status set to {Status}", id, activeStatus.Value);
        }

        return activeStatus;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var deleted = await _repository.DeleteAsync(id);
        if (deleted)
        {
            // Invalidate semantic vector cache
            await _knowledgeVectorService.InvalidateCacheAsync();
            _logger.LogInformation("Store knowledge article #{Id} deleted", id);
        }

        return deleted;
    }
}

