using TanishElectronics.Api.DTOs.Admin.StoreKnowledge;
using TanishElectronics.Api.DTOs.Common;

namespace TanishElectronics.Api.Interfaces.Repositories;

public interface IStoreKnowledgeRepository
{
    Task<PagedResultDto<StoreKnowledgeItemDto>> GetStoreKnowledgeArticlesAsync(StoreKnowledgeQueryDto query);

    Task<List<string>> GetCategoriesAsync();

    Task<StoreKnowledgeItemDto?> GetByIdAsync(int id);

    Task<StoreKnowledgeItemDto> CreateAsync(CreateStoreKnowledgeDto dto);

    Task<StoreKnowledgeItemDto?> UpdateAsync(int id, UpdateStoreKnowledgeDto dto);

    Task<bool?> ToggleActiveAsync(int id);

    Task<bool> DeleteAsync(int id);
}