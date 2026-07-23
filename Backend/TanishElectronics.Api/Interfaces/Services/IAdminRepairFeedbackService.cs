using TanishElectronics.Api.DTOs.Admin.Feedback;
using TanishElectronics.Api.DTOs.Common;

namespace TanishElectronics.Api.Interfaces.Services;

public interface IAdminRepairFeedbackService
{
    Task<PagedResultDto<AdminRepairFeedbackDto>> GetAllAsync(AdminFeedbackQueryDto query);

    Task UpdatePublicStatusAsync(int feedbackId, UpdateFeedbackPublicStatusDto dto);
}