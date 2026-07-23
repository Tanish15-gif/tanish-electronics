using TanishElectronics.Api.DTOs.Admin.ServiceRequests;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.DTOs.ServiceRequests;

namespace TanishElectronics.Api.Interfaces.Services;

public interface IServiceRequestService
{
    Task<ServiceRequestCreatedDto> CreateAsync(CreateServiceRequestDto dto);
    Task<ServiceRequestTrackingDto> TrackAsync(TrackServiceRequestDto dto);

    Task<PagedResultDto<AdminServiceRequestListItemDto>> GetAdminServiceRequestsAsync(AdminServiceRequestQueryDto query);

    Task<AdminServiceRequestDetailsDto> GetAdminServiceRequestByIdAsync(int serviceRequestId);

    Task UpdateStatusAsync(int serviceRequestId, UpdateServiceRequestStatusDto dto);

    Task UpdateServiceRequestPricingAsync(int id, UpdateServiceRequestPricingDto dto);
    Task<UploadServiceRequestImagesResultDto> UploadImageAsync(int serviceRequestId, List<IFormFile> images);

    Task UpdateRepairWorkNotesAsync(int id, UpdateRepairWorkNotesDto dto);
}