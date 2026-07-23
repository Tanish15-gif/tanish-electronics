using TanishElectronics.Api.DTOs.Admin.Feedback;
using TanishElectronics.Api.DTOs.Common;

namespace TanishElectronics.Api.Interfaces.Repositories;

public interface IAdminRepairFeedbackRepository
{
    Task<PagedResultDto<AdminRepairFeedbackDto>> GetAllAsync(AdminFeedbackQueryDto query);

    Task<bool> UpdatePublicStatusAsync(int feedbackId, bool isPublic);
}