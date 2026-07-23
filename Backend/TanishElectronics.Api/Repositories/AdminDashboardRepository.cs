using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Admin.Dashboard;
using TanishElectronics.Api.Interfaces.Repositories;

namespace TanishElectronics.Api.Repositories;

public class AdminDashboardRepository : IAdminDashboardRepository
{
    private readonly TanishElectronicsDbContext _dbContext;
    public AdminDashboardRepository(TanishElectronicsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<AdminDashboardSummaryDto> GetSummaryAsync()
    {
        var totalServicRequests = await _dbContext.ServiceRequests
            .CountAsync(count => count.DeletedAt == null);

        var pendingServicRequests = await CountServiceRequestsByIdStatusAsync(ServiceStatusName.Pending);

        var inProgressServiceRequests = await CountServiceRequestsByIdStatusAsync(ServiceStatusName.InProgress);

        var completedServiceRequests = await CountServiceRequestsByIdStatusAsync(ServiceStatusName.Completed);


        var totalEnquiries = await _dbContext.Enquiries.CountAsync(enquiry => enquiry.DeletedAt == null);

        var newEnquiries = await CountEnquiriesByStatusAsync(EnquiryStatusNames.New);

        var totalProducts = await _dbContext.Products.CountAsync(product => product.DeletedAt == null);

        var availableProducts = await _dbContext.Products.CountAsync(product => product.DeletedAt == null && product.IsAvailable);
        var featuredProducts = await _dbContext.Products.CountAsync(product => product.DeletedAt == null && product.IsFeatured);
        var lowStockProducts = await _dbContext.Products.CountAsync(product => product.DeletedAt == null && product.StockQuantity <= 1);

        var recentServiceRequest = await GetRecentServiceRequestAsync();
        var recentEnquiries = await GetRecentEnquiriesAsync();

        return new AdminDashboardSummaryDto
        {
            TotalServiceRequests = totalServicRequests,
            PendingServiceRequests = pendingServicRequests,
            InProgressServiceRequests = inProgressServiceRequests,
            CompletedServiceRequests = completedServiceRequests,

            TotalEnquiries = totalEnquiries,
            NewEnquiries = newEnquiries,

            TotalProducts = totalProducts,
            AvailableProducts = availableProducts,
            FeaturedProducts = featuredProducts,
            LowStockProducts = lowStockProducts,

            RecentServiceRequests = recentServiceRequest,
            RecentEnquiries = recentEnquiries
        };
    }

    private async Task<int> CountServiceRequestsByIdStatusAsync(string statusName)
    {
        return await (
            from request in _dbContext.ServiceRequests
            join status in _dbContext.ServiceStatuses
                on request.CurrentStatusId equals status.ServiceStatusId
            where request.DeletedAt == null &&
                status.StatusName == statusName
            select request
        ).CountAsync();
    }
    private async Task<int> CountEnquiriesByStatusAsync(string statusName)
    {
        return await (
            from enquiry in _dbContext.Enquiries
            join status in _dbContext.EnquiryStatuses
                on enquiry.EnquiryStatusId equals status.EnquiryStatusId
            where enquiry.DeletedAt == null &&
                status.StatusName == statusName
            select enquiry
        ).CountAsync();
    }
    private async Task<List<RecentServiceRequestDto>> GetRecentServiceRequestAsync()
    {
        return await (
            from request in _dbContext.ServiceRequests
            join category in _dbContext.ServiceCategories
                on request.ServiceCategoryId equals category.ServiceCategoryId
            join status in _dbContext.ServiceStatuses
                on request.CurrentStatusId equals status.ServiceStatusId
            where request.DeletedAt == null
            orderby request.CreatedAt descending
            select new RecentServiceRequestDto
            {
                ServiceRequestId = request.ServiceRequestId,
                RequestNumber = request.RequestNumber,
                CustomerName = request.CustomerName,
                ServiceCategory = category.CategoryName,
                CurrentStatus = status.StatusName,
                CreatedAt = request.CreatedAt
            }
        ).Take(5).ToListAsync();
    }
    private async Task<List<RecentEnquiryDto>> GetRecentEnquiriesAsync()
    {
        return await (
            from enquiry in _dbContext.Enquiries
            join status in _dbContext.EnquiryStatuses
                on enquiry.EnquiryStatusId equals status.EnquiryStatusId
            join products in _dbContext.Products
                on enquiry.ProductId equals products.ProductId into productJoin
            from product in productJoin.DefaultIfEmpty()
            where enquiry.DeletedAt == null
            orderby enquiry.CreatedAt descending
            select new RecentEnquiryDto
            {
                EnquiryId = enquiry.EnquiryId,
                FullName = enquiry.FullName,
                PhoneNumber = enquiry.PhoneNumber,
                ProductName = product != null ? product.ProductName : null,
                Status = status.StatusName,
                CreatedAt = enquiry.CreatedAt
            }
        ).Take(5).ToListAsync();
    }
}