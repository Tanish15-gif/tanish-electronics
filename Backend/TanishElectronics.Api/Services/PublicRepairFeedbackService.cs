using TanishElectronics.Api.DTOs.Public.Feedbacks;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class PublicRepairFeedbackService : IPublicRepairFeedbackService
{
    private readonly IPublicRepairFeedbackRepository _repository;
    public PublicRepairFeedbackService(IPublicRepairFeedbackRepository repository)
    {
        _repository = repository;
    }
    public async Task<List<PublicRepairFeedbackDto>> GetPublicFeedbacksAsync(int limit)
    {
        if (limit <= 0) limit = 6;
        if (limit > 20) limit = 20;

        return await _repository.GetPublicFeedbacksAsync(limit);
    }
}