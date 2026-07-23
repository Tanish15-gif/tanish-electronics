using TanishElectronics.Api.DTOs.Admin.Feedback;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class AdminRepairFeedbackService : IAdminRepairFeedbackService
{
    private readonly IAdminRepairFeedbackRepository _repository;
    private readonly IPublicOutputCacheInvalidator _outputCacheInvalidator;
    public AdminRepairFeedbackService(IAdminRepairFeedbackRepository repository, IPublicOutputCacheInvalidator outputCacheInvalidator)
    {
        _repository = repository;
        _outputCacheInvalidator = outputCacheInvalidator;
    }

    public async Task<PagedResultDto<AdminRepairFeedbackDto>> GetAllAsync(AdminFeedbackQueryDto query)
    {
        return await _repository.GetAllAsync(query);
    }

    public async Task UpdatePublicStatusAsync(int feedbackId, UpdateFeedbackPublicStatusDto dto)
    {
        var updated = await _repository.UpdatePublicStatusAsync(feedbackId, dto.IsPublic);

        if (!updated) throw new KeyNotFoundException("FeedBack not found");
        await _outputCacheInvalidator.EvictFeedbacksAsync();
    }
}