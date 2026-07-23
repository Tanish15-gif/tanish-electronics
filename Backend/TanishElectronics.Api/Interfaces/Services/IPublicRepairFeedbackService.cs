using TanishElectronics.Api.DTOs.Public.Feedbacks;

namespace TanishElectronics.Api.Interfaces.Services;

public interface IPublicRepairFeedbackService
{
    Task<List<PublicRepairFeedbackDto>> GetPublicFeedbacksAsync(int limit);
}