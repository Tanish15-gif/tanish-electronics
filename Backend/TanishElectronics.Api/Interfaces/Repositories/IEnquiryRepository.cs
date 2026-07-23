using TanishElectronics.Api.DTOs.Admin.Enquiries;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.Entities;

namespace TanishElectronics.Api.Interfaces.Repositories;

public interface IEnquiryRepository
{
    Task<bool> ProductExistsAsync(int productId);
    Task<bool> ServiceRequestExistsAsync(int serviceRequestId);
    Task<int> GetStatusIdByNameAsync(string statusName);
    Task AddEnquiryAsync(Enquiry enquiry);

    Task<PagedResultDto<AdminEnquiryListItemDto>> GetAdminEnquiriesAsync(AdminEnquiryQueryDto query);

    Task<Enquiry?> GetEnquiryEntityByIdAsync(int enquiryId);
    Task<bool> EnquiryStatusExistsAsync(int statusId);
    Task<AdminEnquiryDetailsDto?> GetAdminEnquiryByIdAsync(int id);
    Task<List<EnquiryNoteDto>> GetEnquiryNotesAsync(int enquiryId);
    Task AddEnquiryNoteAsync(EnquiryNote enquiryNote);
    Task SaveChangesAsync();
}