using TanishElectronics.Api.DTOs.Public.Feedbacks;

namespace TanishElectronics.Api.Interfaces.Repositories;

public interface IPublicRepairFeedbackRepository
{
    Task<List<PublicRepairFeedbackDto>> GetPublicFeedbacksAsync(int limit);
}