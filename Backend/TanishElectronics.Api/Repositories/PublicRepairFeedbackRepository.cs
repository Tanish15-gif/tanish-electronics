using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.Delegates;
using TanishElectronics.Api.DTOs.Public.Feedbacks;
using TanishElectronics.Api.Interfaces.Repositories;

namespace TanishElectronics.Api.Repositories;

public class PublicRepairFeedbackRepository : IPublicRepairFeedbackRepository
{
    private readonly TanishElectronicsDbContext _dbContext;
    private readonly PublicCustomerNameFormatter _formatter;
    public PublicRepairFeedbackRepository(TanishElectronicsDbContext dbContext, PublicCustomerNameFormatter formatter)
    {
        _dbContext = dbContext;
        _formatter = formatter;
    }
    public async Task<List<PublicRepairFeedbackDto>> GetPublicFeedbacksAsync(int limit)
    {
        var feedbacks = await (
            from feedback in _dbContext.CustomerRepairFeedbacks
            join request in _dbContext.ServiceRequests
                on feedback.ServiceRequestId equals request.ServiceRequestId
            join category in _dbContext.ServiceCategories
                on request.ServiceCategoryId equals category.ServiceCategoryId
            where feedback.IsPublic == true
                  && feedback.Comment != null
                  && feedback.Comment != ""
                  && request.DeletedAt == null
            orderby feedback.CreatedAt descending
            select new
            {
                feedback.CustomerRepairFeedbackId,
                request.CustomerName,
                ServiceCategory = category.CategoryName,
                feedback.Rating,
                feedback.Comment,
                feedback.CreatedAt
            }
        ).Take(limit).ToListAsync();
        return feedbacks.Select(feedback => new PublicRepairFeedbackDto
        {
            CustomerRepairsFeedbackId = feedback.CustomerRepairFeedbackId,
            CustomerName = _formatter(feedback.CustomerName),
            ServiceCategory = feedback.ServiceCategory,
            Rating = feedback.Rating,
            Comment = feedback.Comment!,
            CreatedAt = feedback.CreatedAt
        }).ToList();
    }
}