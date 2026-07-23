using TanishElectronics.Api.DTOs.Admin.Announcements;
using TanishElectronics.Api.Events.Products;
using TanishElectronics.Api.Interfaces.Events;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class ProductCreatedAnnouncementHandler : IProductCreatedAnnouncementHandler
{
    private readonly IAnnouncementService _service;
    public ProductCreatedAnnouncementHandler(IAnnouncementService service)
    {
        _service = service;
    }
    public async Task HandleAsync(ProductCreatedEventArgs args)
    {
        if (!args.CreateAnnouncement)
        {
            return;
        }
        var title = string.IsNullOrWhiteSpace(args.AnnouncementTitle)
            ? $"{args.ProductName} is now available"
            : args.AnnouncementTitle.Trim();

        var message = string.IsNullOrWhiteSpace(args.AnnouncementMessage)
            ? BuildDefaultMessage(args)
            : args.AnnouncementMessage.Trim();

        var dto = new CreateAnnouncementDto
        {
            Title = title,
            Message = message,

            AnnouncementType = "Product",
            Audience = "All",
            DisplayLocation = "Homepage",

            ButtonText = "View Products",
            ButtonLink = "/products",

            StartAt = DateTime.Now,
            EndAt = args.AnnouncementEndAt,

            Priority = args.AnnouncementPriority,
            IsActive = true,
            ShowOnce = true
        };
        await _service.CreateAnnouncementAsync(dto, null);
    }
    private static string BuildDefaultMessage(ProductCreatedEventArgs args)
    {
        var productDetails = new List<string>();

        if (!string.IsNullOrWhiteSpace(args.Brand))
        {
            productDetails.Add(args.Brand);
        }

        if (!string.IsNullOrWhiteSpace(args.ModelName))
        {
            productDetails.Add(args.ModelName);
        }

        var details = productDetails.Count > 0
            ? $" ({string.Join(" • ", productDetails)})"
            : "";

        return $"{args.ProductName}{details} is now available at Tanish Electronics. Visit the products page or contact the shop for more details.";
    }
}