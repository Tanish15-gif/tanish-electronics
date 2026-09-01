using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;
using TanishElectronics.Api.Settings;

namespace TanishElectronics.Api.Services;

public partial class ChatbotService : IChatbotService
{
    private readonly HttpClient _httpClient;
    private readonly GroqSettings _groqSettings;
    private readonly IProductService _productService;
    private readonly IShopSettingsRepository _settingsRepository;
    private readonly ILogger<ChatbotService> _logger;
    private readonly IServiceRequestService _serviceRequestService;
    private readonly ILookUpService _lookUpService;
    private readonly IAppMemoryCacheService _cacheService;
    private readonly IAnnouncementService _announcementService;
    private readonly IPublicRepairFeedbackService _feedbackService;
    private readonly IEnquiryService _enquiryService;
    private readonly TanishElectronicsDbContext _dbContext;
    private readonly string GroqEndpoint = "https://api.groq.com/openai/v1/chat/completions";

    public ChatbotService
    (
        HttpClient httpClient,
        IOptions<GroqSettings> groqSettings,
        IProductService productService,
        IShopSettingsRepository settingsRepository,
        ILogger<ChatbotService> logger,
        IServiceRequestService serviceRequestService,
        ILookUpService lookUpService,
        IAppMemoryCacheService cacheService,
        IAnnouncementService announcementService,
        IPublicRepairFeedbackService feedbackService,
        IEnquiryService enquiryService,
        TanishElectronicsDbContext dbContext
    )
    {
        _httpClient = httpClient;
        _groqSettings = groqSettings.Value;
        _productService = productService;
        _settingsRepository = settingsRepository;
        _logger = logger;
        _serviceRequestService = serviceRequestService;
        _lookUpService = lookUpService;
        _cacheService = cacheService;
        _announcementService = announcementService;
        _feedbackService = feedbackService;
        _enquiryService = enquiryService;
        _dbContext = dbContext;
    }

    private static readonly Dictionary<string, string> Synonyms = new()
    {
        { "telly", "tv" },
        { "television", "tv" },
        { "led tv", "tv" },
        { "smart tv", "tv" },
        { "bluetooth speaker", "speaker" },
        { "home theater", "theatre" },
        { "batteries", "battery" },
        { "offer", "sale" },
        { "discount", "sale" },
        { "deal", "sale" },
        { "review", "feedback" },
        { "testimonial", "feedback" },
        { "rating", "feedback" },
    };

    private static readonly Regex GenericEnquiryTagRegex =
        new(@"\[SUBMIT_ENQUIRY:\s*(.*?)\]", RegexOptions.IgnoreCase | RegexOptions.Singleline);

    private static readonly Regex GenericBookingTagRegex =
        new(@"\[SUBMIT_BOOKING:\s*(.*?)\]", RegexOptions.IgnoreCase | RegexOptions.Singleline);

    private static readonly Regex RequestNumberPattern =
        new(@"\bTE-\d{4}-\d{3,6}\b", RegexOptions.IgnoreCase);

    private static readonly Regex PhoneNumberPattern =
        new(@"\b\d{10}\b");

    private static readonly string[] TrackingKeywords =
        { "track", "status", "where's my", "where is my", "my repair", "my request" };

    private static Dictionary<string, string> ParseTagKeyValues(string raw)
    {
        var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var parts = raw.Split('|');
        foreach (var part in parts)
        {
            var kv = part.Split('=', 2);
            if (kv.Length == 2)
            {
                dict[kv[0].Trim()] = kv[1].Trim();
            }
        }
        return dict;
    }

    private static string NormalizeMessage(string message)
    {
        var normalized = message.ToLowerInvariant();
        foreach (var (synonym, canonical) in Synonyms)
        {
            normalized = normalized.Replace(synonym, canonical);
        }
        return normalized;
    }
}