namespace TanishElectronics.Api.Constants;

public class AnnouncementConstants
{
    public static readonly string[] AllowedTypes =
    {
        "Product","Offer","ServiceAlert","ShopNotice","RepairMachine","FeedbackHighlight"
    };
    public static readonly string[] AllowedAudiences =
    {
        "All","SignedCustomers","UnSignedCustomers"
    };
    public static readonly string[] AllowedLocations =
    {
        "Homepage",
        "CustomerDashboard",
        "ProductsPage",
        "BookRepairPage",
        "AllPublicPages"
    };
    public const int MinPriority = 1;
    public const int MaxPriority = 4;

    public const int DefaultPublicLimit = 3;
    public const int MaxPublicLimit = 10;
}