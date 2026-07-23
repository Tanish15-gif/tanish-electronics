using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Admin.Enquiries;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Repositories;

namespace TanishElectronics.Api.Repositories;

public class EnquiryRepository : IEnquiryRepository
{
    private readonly TanishElectronicsDbContext _dbContext;
    public EnquiryRepository(TanishElectronicsDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    public async Task AddEnquiryAsync(Enquiry enquiry)
    {
        await _dbContext.Enquiries.AddAsync(enquiry);
    }

    public async Task<bool> EnquiryStatusExistsAsync(int statusId)
    {
        return await _dbContext.EnquiryStatuses
            .AnyAsync(status =>
                status.EnquiryStatusId == statusId &&
                status.IsActive
            );
    }

    public async Task<PagedResultDto<AdminEnquiryListItemDto>> GetAdminEnquiriesAsync(AdminEnquiryQueryDto query)
    {
        var pageNumber = Math.Max(query.PageNumber, 1);
        var pageSize = Math.Clamp(query.PageSize, 5, 50);

        var requestsQuery =
        from enquiry in _dbContext.Enquiries.AsNoTracking()
        join status in _dbContext.EnquiryStatuses.AsNoTracking()
            on enquiry.EnquiryStatusId equals status.EnquiryStatusId
        join product in _dbContext.Products.AsNoTracking()
            on enquiry.ProductId equals product.ProductId into productJoin
        from product in productJoin.DefaultIfEmpty()
        where enquiry.DeletedAt == null
        select new
        {
            enquiry,
            status,
            product
        };

        if (query.StatusId.HasValue)
        {
            requestsQuery = requestsQuery.Where(x => x.enquiry.EnquiryStatusId == query.StatusId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var searchText = query.Search.Trim();

            requestsQuery = requestsQuery.Where(x =>
                x.enquiry.FullName.Contains(searchText) ||
                x.enquiry.PhoneNumber.Contains(searchText) ||
                (x.enquiry.Subject != null && x.enquiry.Subject.Contains(searchText)) ||
                (x.product != null && x.product.ProductName.Contains(searchText)));
        }

        var totalRecords = await requestsQuery.CountAsync();

        var items = await requestsQuery
            .OrderByDescending(x => x.enquiry.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AdminEnquiryListItemDto
            {
                EnquiryId = x.enquiry.EnquiryId,

                FullName = x.enquiry.FullName,
                PhoneNumber = x.enquiry.PhoneNumber,
                Email = x.enquiry.Email,

                ProductName = x.product != null ? x.product.ProductName : null,
                Subject = x.enquiry.Subject,
                Message = x.enquiry.Message,

                StatusId = x.status.EnquiryStatusId,
                Status = x.status.StatusName,

                CreatedAt = x.enquiry.CreatedAt
            })
            .ToListAsync();

        var totalPages = (int)Math.Ceiling(totalRecords / (double)pageSize);

        return new PagedResultDto<AdminEnquiryListItemDto>
        {
            Items = items,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalRecords = totalRecords,
            TotalPages = Math.Max(totalPages, 1)
        };
    }

    public async Task<AdminEnquiryDetailsDto?> GetAdminEnquiryByIdAsync(int id)
    {
        return await (
            from enquiry in _dbContext.Enquiries
            join status in _dbContext.EnquiryStatuses
                on enquiry.EnquiryStatusId equals status.EnquiryStatusId

            join product in _dbContext.Products
                on enquiry.ProductId equals product.ProductId into productJoin

            from product in productJoin.DefaultIfEmpty()

            where enquiry.EnquiryId == id && enquiry.DeletedAt == null

            select new AdminEnquiryDetailsDto
            {
                EnquiryId = enquiry.EnquiryId,

                ProductId = enquiry.ProductId,
                ProductName = product != null ? product.ProductName : null,
                ProductPrice = product != null ? product.Price : null,

                FullName = enquiry.FullName,
                PhoneNumber = enquiry.PhoneNumber,
                Email = enquiry.Email,

                Subject = enquiry.Subject,
                Message = enquiry.Message,

                StatusId = status.EnquiryStatusId,
                Status = status.StatusName,

                CreatedAt = enquiry.CreatedAt
            }
        ).FirstOrDefaultAsync();
    }

    public async Task<Enquiry?> GetEnquiryEntityByIdAsync(int enquiryId)
    {
        return await _dbContext.Enquiries
            .FirstOrDefaultAsync(enquiry =>
                enquiry.EnquiryId == enquiryId &&
                enquiry.DeletedAt == null);
    }

    public async Task<List<EnquiryNoteDto>> GetEnquiryNotesAsync(int enquiryId)
    {
        return await _dbContext.EnquiryNotes
            .Where(note => note.EnquiryId == enquiryId)
            .OrderByDescending(note => note.CreatedAt)
            .Select(note => new EnquiryNoteDto
            {
                EnquiryNoteId = note.EnquiryNoteId,
                EnquiryId = note.EnquiryId,
                Note = note.Note,
                CreatedAt = note.CreatedAt
            })
            .ToListAsync();
    }
    public async Task AddEnquiryNoteAsync(EnquiryNote enquiryNote)
    {
        await _dbContext.EnquiryNotes.AddAsync(enquiryNote);
    }

    public async Task<int> GetStatusIdByNameAsync(string statusName)
    {
        var status = await _dbContext.EnquiryStatuses.FirstOrDefaultAsync(status => status.StatusName == statusName);

        if (status == null)
        {
            throw new InvalidOperationException($"Enquiry status '{statusName}' was not found.");
        }
        return status.EnquiryStatusId;
    }

    public async Task<bool> ProductExistsAsync(int productId)
    {
        return await _dbContext.Products.AnyAsync(product =>
            product.ProductId == productId &&
            product.DeletedAt == null &&
            product.IsAvailable
        );
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }

    public async Task<bool> ServiceRequestExistsAsync(int serviceRequestId)
    {
        return await _dbContext.ServiceRequests.AnyAsync(request =>
            request.ServiceRequestId == serviceRequestId &&
            request.DeletedAt == null
        );
    }
}