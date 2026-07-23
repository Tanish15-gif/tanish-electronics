using TanishElectronics.Api.DTOs.Admin.Enquiries;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.DTOs.Enquiries;
namespace TanishElectronics.Api.Interfaces.Services;

public interface IEnquiryService
{
    Task<EnquiryCreatedDto> CreateAsync(CreateEnquiryDto dto);

    Task<PagedResultDto<AdminEnquiryListItemDto>> GetAdminEnquiriesAsync(AdminEnquiryQueryDto queryDto);

    Task UpdateStatusAsync(int enquiryId, UpdateEnquiryStatusDto dto, int adminAppUserId);
    Task<AdminEnquiryDetailsDto> GetAdminEnquiryByIdAsync(int id);
    Task<List<EnquiryNoteDto>> GetEnquiryNotesAsync(int enquiryId);
    Task<EnquiryNoteDto> AddEnquiryNoteAsync(int enquiryId, CreateEnquiryNoteDto dto);
}