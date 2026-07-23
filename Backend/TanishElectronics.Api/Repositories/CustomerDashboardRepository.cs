using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Customer.DashBoard;
using TanishElectronics.Api.Interfaces.Repositories;

namespace TanishElectronics.Api.Repositories;

public class CustomerDashboardRepository : ICustomerDashboardRepository
{
    private readonly TanishElectronicsDbContext _dbContext;
    public CustomerDashboardRepository(TanishElectronicsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CustomerDashBoardDto?> GetDashBoardAsync(string clerkUserId)
    {
        var appUser = await _dbContext.AppUsers
            .FirstOrDefaultAsync(user =>
                user.ClerkUserId == clerkUserId &&
                user.IsActive &&
                user.DeletedAt == null);
        if (appUser == null)
        {
            return null;
        }
        var appUserId = appUser.AppUserId;
        var email = appUser.Email;
        var phoneNumber = appUser.PhoneNumber;

        var customerIds = await _dbContext.Customers
            .Where(customer =>
                customer.IsActive && customer.DeletedAt == null &&
                (
                    customer.AppUserId == appUserId ||
                    customer.Email == email ||
                    (!string.IsNullOrWhiteSpace(phoneNumber) &&
                        customer.PhoneNumber == phoneNumber)
                ))
                .Select(customer => customer.CustomerId)
                .ToListAsync();

        var serviceRequestQuery =
            from request in _dbContext.ServiceRequests
            join category in _dbContext.ServiceCategories
                on request.ServiceCategoryId equals category.ServiceCategoryId
            join status in _dbContext.ServiceStatuses
                on request.CurrentStatusId equals status.ServiceStatusId
            where request.DeletedAt == null &&
                (
                    customerIds.Contains(request.CustomerId ?? 0) ||
                    request.Email == email ||
                    (!string.IsNullOrWhiteSpace(phoneNumber) &&
                        request.PhoneNumber == phoneNumber)
                )
            orderby request.CreatedAt descending
            select new CustomerDashboardServiceRequestDto
            {
                ServiceRequestId = request.ServiceRequestId,
                RequestNumber = request.RequestNumber,
                ServiceCategory = category.CategoryName,
                CurrentStatus = status.StatusName,
                ServiceType = request.ServiceType,
                DeviceName = request.DeviceName,
                Brand = request.Brand,
                ModelName = request.ModelName,
                PreferredDate = request.PreferredDate,
                PreferredTimeSlot = request.PreferredTimeSlot,
                CreatedAt = request.CreatedAt
            };
        var allServiceRequests = await serviceRequestQuery.ToListAsync();

        var enquiriesQuery =
            from enquiry in _dbContext.Enquiries
            join enquiryStatus in _dbContext.EnquiryStatuses
                on enquiry.EnquiryStatusId equals enquiryStatus.EnquiryStatusId
            join product in _dbContext.Products
                on enquiry.ProductId equals product.ProductId into productJoin
            from product in productJoin.DefaultIfEmpty()
            where enquiry.DeletedAt == null &&
                  (
                      customerIds.Contains(enquiry.CustomerId ?? 0) ||
                      enquiry.Email == email ||
                      (!string.IsNullOrWhiteSpace(phoneNumber) &&
                       enquiry.PhoneNumber == phoneNumber)
                  )
            orderby enquiry.CreatedAt descending
            select new CustomerDashboardEnquiryDto
            {
                EnquiryId = enquiry.EnquiryId,
                ProductId = enquiry.ProductId,
                ProductName = product == null ? null : product.ProductName,
                Subject = enquiry.Subject,
                Message = enquiry.Message,
                Status = enquiryStatus.StatusName,
                CreatedAt = enquiry.CreatedAt
            };

        var allEnquiries = await enquiriesQuery.ToListAsync();

        var activeRequests = allServiceRequests.Count(request =>
            !request.CurrentStatus.ToLower().Contains("completed") &&
            !request.CurrentStatus.ToLower().Contains("cancelled"));

        var completedRequests = allServiceRequests.Count(request =>
            request.CurrentStatus.ToLower().Contains("completed"));

        return new CustomerDashBoardDto
        {
            FullName = appUser.FullName,
            Email = appUser.Email,
            PhoneNumber = appUser.PhoneNumber,

            TotalRequest = allServiceRequests.Count,
            ActiveRequest = activeRequests,
            CompletedRequest = completedRequests,
            TotalEnquiries = allEnquiries.Count,

            ServiceRequests = allServiceRequests,
            Enquiries = allEnquiries
        };
    }
}