using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Enquiries;
using TanishElectronics.Api.DTOs.Public.Announcements;
using TanishElectronics.Api.DTOs.Public.ChatBot;
using TanishElectronics.Api.DTOs.ServiceRequests;
using TanishElectronics.Api.Interfaces.Repositories;
using TanishElectronics.Api.Interfaces.Services;
using TanishElectronics.Api.Settings;

namespace TanishElectronics.Api.Services;

public class ChatbotService : IChatbotService
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
        new(@"\bTE-\d{4}-\d{3,6}\b", System.Text.RegularExpressions.RegexOptions.IgnoreCase);

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
    private static string BuildSystemPrompt(string groundingContext) => $"""
        You are the friendly, expert customer support assistant for Tanish Electronics, a trusted electronics and TV repair & sales shop in Santacruz West, Mumbai.

        Core Capabilities:
            1. **Direct Chat-Based Repair Booking**: You can book repairs directly right here in the chat from start to finish!
            2. **Instant Repair Tracking**: You can track repair status in real-time.
            3. **Product Information & Recommendations**: You can guide customers on TVs, remotes, adapters, and accessories.
            4. **Customer Enquiries & Callbacks**: You can take product enquiries and callback requests directly in chat.

        Rules:
            - Keep responses warm, helpful, and concise (1-3 sentences maximum). No robotic filler.
            - Never invent prices, stock, repair statuses, reviews, or offers. Only state facts from "Dynamic Shop Data" below.

            - **Chat-Based Repair Booking (Fully Supported & Automated)**:
              - When a customer says "I want to book a repair", asks to fix a TV/device, or describes an issue:
                1. **NEVER tell them to leave the chat or click an external button to book.** Always handle the entire booking directly in chat!
                2. Prompt for the repair details in this clean, structured format:
                   - **If Guest / Unsigned**:
                     "I can book your repair request right here! Please provide:
                     • **Name**:
                     • **Phone Number**:
                     • **Device & Brand**: *(e.g. Samsung 55\" 4K Smart TV)*
                     • **Issue Description**: *(e.g. No display / sound working)*
                     • **Service Type**: *Shop Repair (Drop-off)* OR *Home Visit*
                     • **Visit Address**: *(only needed if Home Visit)*"
                   - **If Signed In (Authenticated Customer Profile present)**:
                     "I can book this repair request under your account:
                     • **Name**: [Customer Name]
                     • **Phone Number**: [Customer Phone]

                     Please share:
                     • **Device & Brand**: *(e.g. Samsung 55\" Smart TV)*
                     • **Issue Description**: *(e.g. No display / power issue)*
                     • **Service Type**: *Shop Repair* OR *Home Visit*
                     • **Visit Address**: *(only if Home Visit)*"
                3. **When Submitting a Booking**:
                   Once you have the required details (Name, Phone, Device, Issue, Service Type):
                   1. Say a brief confirmation:
                      "Thank you [Name]! I'm creating your repair booking now."
                   2. ALWAYS append this exact tag at the very end (WITHOUT backticks or quotes):
                      [SUBMIT_BOOKING: name=Customer Name | phone=9876543210 | category=TV Repair | device=Samsung 55 LED | issue=No display | servicetype=Home Visit | address=Flat 402 Santacruz West]
                      *(For Shop Repair, set servicetype=Shop Repair and omit address or set address=Shop Drop-off)*.
                   3. Do NOT invent a fake tracking number or write a custom summary block yourself — the backend system automatically processes the booking in the database and renders the official verified Booking Summary and Tracking Number card immediately!

            - **Currently Viewed Product Page Awareness**:
              - If Dynamic Shop Data contains a **"Currently Viewed Product Page"**, the customer is currently looking at that exact product on their screen.
              - When they say "this product", "this item", "i want to enquiry about this products", "i want this at 1000", or provide contact details, **they are referring to the Currently Viewed Product**.
              - **DO NOT ask them "which product are you interested in?"**. You already know!
              - State the price/details of the currently viewed product, acknowledge their offer/query, and ask for/confirm their details.

            - **Product Enquiries & Sales**:
              - When a customer asks about a specific product (or currently viewed product):
                1. ALWAYS state the key details first (title, price, stock status, and condition) directly from Dynamic Shop Data.
                2. If they want to enquire, buy, or negotiate:
                   - **If Guest / Unsigned**: Prompt in this clean, structured format:
                     "To submit your enquiry for **[Product Name]**, please provide:
                     • **Name**:
                     • **Phone Number**:
                     • **Message / Offer** *(optional)*:"
                   - **If Signed In (Authenticated Customer Profile present)**:
                     "I can submit this enquiry under your account:
                     • **Name**: [Customer Name]
                     • **Phone Number**: [Customer Phone]
                     • **Message / Offer** *(optional)*: [Ask if they want to add a note/offer or proceed directly]"
              - If searching for products generally (e.g. "show me TVs", "do you have remotes?"), say "Here are some options we currently have in stock:" and let the UI display product cards.
              - If Shop Data says "No matching products currently in stock", state that clearly and offer to take an enquiry.
              - **When to Submit an Enquiry**:
                When the customer provides their name and phone (or confirms to submit):
                1. ALWAYS output a clean confirmation with a **Preview Summary**:
                   **Enquiry Submitted Successfully!**

                   **Enquiry Summary:**
                   • **Product**: [Product Name]
                   • **Customer**: [Customer Name]
                   • **Phone**: [Customer Phone]
                   • **Message**: [Customer's message or offer, or 'General Enquiry' if none]
                   • **Status**: Received — Our team will contact you shortly."
                2. ALWAYS append this exact tag at the very end (WITHOUT backticks or quotes):
                   [SUBMIT_ENQUIRY: name=Customer Name | phone=9876543210 | message=Customer's Exact Message or Offer | productid=ACTUAL_ID | product=ACTUAL_PRODUCT_NAME]
                *Rules for this tag:*
                - `productid`: MUST be the actual numeric Product ID from Dynamic Shop Data (e.g. 13 or 21) or omit if general inquiry. NEVER use a placeholder or fake number.
                - `product`: MUST be the exact name of the product being enquired about (e.g. LG MAGIC REMOTE).
                - `message`: MUST be the customer's actual query, negotiation offer, or requirement (e.g. "i want this at 1000" or "i want this 5 sets"), NEVER your own assistant question!
                - NEVER output incomplete or cut-off sentences like "I'm sorry,". Always write full, professional responses.

            - **Repair Tracking**:
              - If a customer gives a tracking number (e.g. TE-2026-0001) or is signed in, check the repair status from Dynamic Shop Data and state the current status, estimated price, and device details clearly.

            - **Offers & Announcements**:
              - If asked about current offers, sales, notices, updates, or announcements, present active announcements smoothly without rigid labels.

            - **Customer Reviews & Feedback**:
              - If asked about reviews, ratings, or shop reputation, cite the customer feedback data and average rating from Dynamic Shop Data.

            - **Authenticated Customer Profile**:
              - If an "Authenticated Customer Profile" is present in Dynamic Shop Data:
                1. Greet or address the customer warmly by their first name when natural (e.g. "Hi Tanish!").
                2. Auto-fill their Name and Phone for bookings/enquiries so they never have to re-type it.
                3. If they ask "Where is my TV?" or "What's my repair status?", check their Recent & Active Repair Requests and answer immediately.

        Shop Knowledge Base (Treat these as absolute facts):
            - Owner / Founder: Subhash (available at the shop or via phone).
            - Experience: Backed by over 20 years of practical electronics and TV repair experience.
            - Service Areas: Based in Santacruz West, supporting home visits across nearby Mumbai locations (Khar, Bandra, Juhu, Vile Parle, Santacruz East/West, etc.).
            - Specialties: Expert repair for LED, LCD, Smart TVs, QLED, OLED, Box TVs, sound systems, remotes, and adapters.
            - Offerings: Shop repairs, home visits, real-time online tracking, refurbished electronics, and verified accessories.

        Dynamic Shop Data:
        {groundingContext}
    """;

    public async Task<ChatResponseDto> GetReplyAsync(ChatRequestDto request, int? appUserId = null)
    {
        var (groundingContext, matchedProducts) = await BuildGroundingContextAsync(request.Message, request.CurrentPath, appUserId);
        var systemPrompt = BuildSystemPrompt(groundingContext);
        var messages = new List<object> { new { role = "system", content = systemPrompt } };

        foreach (var item in request.History.TakeLast(6))
        {
            messages.Add(new { role = item.Role, content = item.Content });
        }
        messages.Add(new { role = "user", content = request.Message });

        var payload = new
        {
            model = _groqSettings.Model,
            messages,
            max_tokens = _groqSettings.MaxTokens,
            temperature = 0.4
        };

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, GroqEndpoint);
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _groqSettings.ApiKey);
        httpRequest.Content = new StringContent
        (
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        var response = await _httpClient.SendAsync(httpRequest);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError(
                "Groq API failed. Status: {StatusCode}, Body: {Body}",
                response.StatusCode,
                responseBody
            );

            throw new HttpRequestException(
                $"Groq API returned {(int)response.StatusCode} " +
                $"{response.StatusCode}: {responseBody}"
            );
        }
        using var doc = JsonDocument.Parse(responseBody);

        var reply = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? "Sorry, I couldn't process that. Please try again.";

        reply = reply.Trim();

        var enquiryMatch = GenericEnquiryTagRegex.Match(reply);
        var enquirySubmitted = false;

        if (enquiryMatch.Success)
        {
            var dict = ParseTagKeyValues(enquiryMatch.Groups[1].Value);
            dict.TryGetValue("name", out var name);
            dict.TryGetValue("phone", out var phone);
            dict.TryGetValue("message", out var msg);
            dict.TryGetValue("productid", out var tagProductIdStr);
            dict.TryGetValue("product", out var tagProductName);

            int? resolvedProductId = null;
            if (!string.IsNullOrWhiteSpace(tagProductIdStr) && int.TryParse(tagProductIdStr, out var pid))
            {
                resolvedProductId = pid;
            }

            if (!string.IsNullOrWhiteSpace(tagProductName))
            {
                try
                {
                    if (resolvedProductId.HasValue)
                    {
                        var p = await _productService.GetProductByIdAsync(resolvedProductId.Value);
                        if (p == null || (!p.ProductName.Contains(tagProductName, StringComparison.OrdinalIgnoreCase) && !tagProductName.Contains(p.ProductName, StringComparison.OrdinalIgnoreCase)))
                        {
                            resolvedProductId = null;
                        }
                    }

                    if (!resolvedProductId.HasValue)
                    {
                        var allProducts = await _productService.GetProductsAsync(null, null, null, false);
                        var match = allProducts.FirstOrDefault(p =>
                            p.ProductName.Equals(tagProductName, StringComparison.OrdinalIgnoreCase) ||
                            tagProductName.Contains(p.ProductName, StringComparison.OrdinalIgnoreCase) ||
                            p.ProductName.Contains(tagProductName, StringComparison.OrdinalIgnoreCase));
                        if (match != null)
                        {
                            resolvedProductId = match.ProductId;
                        }
                    }
                }
                catch { }
            }

            if (!resolvedProductId.HasValue && !string.IsNullOrWhiteSpace(request.CurrentPath))
            {
                var segments = request.CurrentPath.Trim().Trim('/').Split('/');
                if (segments.Length >= 2 && segments[0].Equals("products", StringComparison.OrdinalIgnoreCase))
                {
                    var idPart = segments[1].Split('?')[0].Split('#')[0].Trim();
                    if (int.TryParse(idPart, out var pathPid))
                    {
                        resolvedProductId = pathPid;
                    }
                }
            }

            var subject = "AI Chatbot Enquiry";
            if (resolvedProductId.HasValue)
            {
                try
                {
                    var product = await _productService.GetProductByIdAsync(resolvedProductId.Value);
                    if (product != null)
                    {
                        subject = $"Product Enquiry: {product.ProductName} (#{product.ProductId})";
                    }
                    else if (!string.IsNullOrWhiteSpace(tagProductName))
                    {
                        subject = $"Product Enquiry: {tagProductName} (#{resolvedProductId.Value})";
                    }
                }
                catch
                {
                    if (!string.IsNullOrWhiteSpace(tagProductName))
                    {
                        subject = $"Product Enquiry: {tagProductName}";
                    }
                }
            }
            else if (!string.IsNullOrWhiteSpace(tagProductName))
            {
                subject = $"Product Enquiry: {tagProductName}";
            }

            var finalMessage = !string.IsNullOrWhiteSpace(msg) && !msg.EndsWith("?") ? msg.Trim() : request.Message.Trim();

            if (!string.IsNullOrWhiteSpace(name) && !string.IsNullOrWhiteSpace(phone) && !string.IsNullOrWhiteSpace(finalMessage))
            {
                try
                {
                    await _enquiryService.CreateAsync(new CreateEnquiryDto
                    {
                        ProductId = resolvedProductId,
                        FullName = name.Trim(),
                        PhoneNumber = phone.Trim(),
                        Message = finalMessage,
                        Subject = subject
                    });
                    enquirySubmitted = true;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to submit enquiry via chatbot.");
                }
            }

            reply = GenericEnquiryTagRegex.Replace(reply, "").Trim().Trim('`', '\'', '"', '\n', '\r', ' ');

            if (enquirySubmitted)
            {
                var pName = !string.IsNullOrWhiteSpace(tagProductName) ? tagProductName : "Electronics Enquiry";
                if (!reply.Contains("Enquiry Summary", StringComparison.OrdinalIgnoreCase))
                {
                    reply += $"\n\n📋 **Enquiry Summary:**\n• **Product**: {pName}\n• **Customer**: {name}\n• **Phone**: {phone}\n• **Message**: {finalMessage}\n• **Status**: Received — Our team will contact you shortly.";
                }
            }
        }

        var bookingMatch = GenericBookingTagRegex.Match(reply);
        var bookingSubmitted = false;
        string? bookedRequestNumber = null;

        if (bookingMatch.Success)
        {
            var dict = ParseTagKeyValues(bookingMatch.Groups[1].Value);
            dict.TryGetValue("name", out var name);
            dict.TryGetValue("phone", out var phone);
            dict.TryGetValue("device", out var device);
            dict.TryGetValue("category", out var categoryName);
            dict.TryGetValue("issue", out var issue);
            dict.TryGetValue("servicetype", out var serviceType);
            dict.TryGetValue("address", out var address);

            name ??= "";
            phone ??= "";
            device ??= "";
            categoryName ??= "TV Repair";
            issue = string.IsNullOrWhiteSpace(issue) ? "Booked via AI Chatbot" : issue;
            serviceType ??= "Shop Repair";

            if (!string.IsNullOrWhiteSpace(name) && !string.IsNullOrWhiteSpace(phone) && !string.IsNullOrWhiteSpace(device))
            {
                try
                {
                    var serviceCategories = await _lookUpService.GetServiceCategoriesAsync();
                    var matchedCategory = serviceCategories.FirstOrDefault(c =>
                        !string.IsNullOrWhiteSpace(c.Name) && categoryName.Contains(c.Name, StringComparison.OrdinalIgnoreCase)
                    ) ?? serviceCategories.FirstOrDefault();

                    var locations = await _lookUpService.GetServiceLocationAsync();
                    var matchedLocation = locations.FirstOrDefault();

                    var normalizedServiceType = serviceType.Contains("home", StringComparison.OrdinalIgnoreCase)
                        ? "Home Visit"
                        : "Shop Repair";

                    var result = await _serviceRequestService.CreateAsync(new CreateServiceRequestDto
                    {
                        CustomerName = name.Trim(),
                        PhoneNumber = phone.Trim(),
                        ServiceCategoryId = matchedCategory?.Id ?? 1,
                        ServiceLocationId = normalizedServiceType == "Home Visit" ? (matchedLocation?.Id ?? 1) : null,
                        DeviceName = device.Trim(),
                        IssueDescription = issue.Trim(),
                        ServiceType = normalizedServiceType,
                        VisitAddress = normalizedServiceType == "Home Visit" ? (!string.IsNullOrWhiteSpace(address) ? address.Trim() : "Address to be confirmed by phone") : null
                    });

                    bookingSubmitted = true;
                    bookedRequestNumber = result.RequestNumber;
                    reply = GenericBookingTagRegex.Replace(reply, "").Trim().Trim('`', '\'', '"', '\n', '\r', ' ');
                    var addrLine = normalizedServiceType == "Home Visit" && !string.IsNullOrWhiteSpace(address) && address != "Shop Drop-off" ? $" — {address}" : "";
                    if (!reply.Contains("Booking Summary", StringComparison.OrdinalIgnoreCase))
                    {
                        reply += $"\n\n📋 **Booking Summary:**\n• **Tracking Number**: `{bookedRequestNumber}`\n• **Customer**: {name} ({phone})\n• **Device**: {device}\n• **Issue**: {issue}\n• **Service Type**: {normalizedServiceType}{addrLine}\n• **Status**: Received — Technician assigned shortly.";
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to create service request via chatbot.");
                    reply = GenericBookingTagRegex.Replace(reply, "").Trim().Trim('`', '\'', '"', '\n', '\r', ' ');
                }
            }
            else
            {
                reply = GenericBookingTagRegex.Replace(reply, "").Trim().Trim('`', '\'', '"', '\n', '\r', ' ');
            }
        }

        var shopSettings = await _cacheService.GetOrCreateAsync(
            "chatbot:shop-settings",
            () => _settingsRepository.GetSettingsAsync(),
            TimeSpan.FromMinutes(1)
        );

        var shopPhone = !string.IsNullOrWhiteSpace(shopSettings?.PrimaryPhone)
            ? shopSettings.PrimaryPhone
            : "+91 98200 00000";

        var actions = new List<ChatActionDto>();
        var lowerMsg = NormalizeMessage(request.Message);
        var lowerReply = reply.ToLowerInvariant();

        if (enquirySubmitted || bookingSubmitted)
        {
            if (bookingSubmitted)
            {
                actions.Add(new ChatActionDto { Label = "Track Repair", Url = "/track-request", Icon = "search" });
                actions.Add(new ChatActionDto { Label = "Call Shop", Url = $"tel:{shopPhone}", Icon = "phone" });
            }
            else if (enquirySubmitted)
            {
                actions.Add(new ChatActionDto { Label = "Call Shop", Url = $"tel:{shopPhone}", Icon = "phone" });
                actions.Add(new ChatActionDto { Label = "Browse Products", Url = "/products", Icon = "package" });
            }
        }
        else
        {
            var productKeywords = new[] { "product", "buy", "price", "stock", "tv", "remote", "speaker", "adapter", "available", "cost", "sale", "offer" };
            var isProductRelated = productKeywords.Any(k => lowerMsg.Contains(k) || lowerReply.Contains(k));

            var trackKeywords = new[] { "track", "status" };
            var isTrackRelated = trackKeywords.Any(k => lowerMsg.Contains(k) || lowerReply.Contains(k));

            if (isProductRelated || (matchedProducts != null && matchedProducts.Any()))
            {
                actions.Add(new ChatActionDto { Label = "Browse Products", Url = "/products", Icon = "package" });
            }

            if (isTrackRelated)
            {
                actions.Add(new ChatActionDto { Label = "Track Repair", Url = "/track-request", Icon = "search" });
            }

            if (lowerMsg.Contains("contact") || lowerMsg.Contains("call") || lowerMsg.Contains("phone") || lowerMsg.Contains("location") || lowerMsg.Contains("address"))
            {
                actions.Add(new ChatActionDto { Label = "Call Shop", Url = $"tel:{shopPhone}", Icon = "phone" });
            }
        }

        return new ChatResponseDto
        {
            Reply = reply,
            Products = (!enquirySubmitted && !bookingSubmitted && matchedProducts?.Any() == true) ? matchedProducts : null,
            Actions = actions.Any() ? actions.DistinctBy(a => a.Label).ToList() : null
        };
    }

    public async IAsyncEnumerable<ChatStreamEventDto> StreamReplyAsync(ChatRequestDto request, [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default, int? appUserId = null)
    {
        var (groundingContext, matchedProducts) = await BuildGroundingContextAsync(request.Message, request.CurrentPath, appUserId);
        var systemPrompt = BuildSystemPrompt(groundingContext);

        var messages = new List<object> { new { role = "system", content = systemPrompt } };

        foreach (var item in request.History.TakeLast(6))
        {
            messages.Add(new { role = item.Role, content = item.Content });
        }
        messages.Add(new { role = "user", content = request.Message });

        var payload = new
        {
            model = _groqSettings.Model,
            messages,
            max_tokens = _groqSettings.MaxTokens,
            temperature = 0.4,
            stream = true
        };

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, GroqEndpoint);
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _groqSettings.ApiKey);
        httpRequest.Content = new StringContent
        (
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        using var response = await _httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("Groq streaming failed: {Status}, {Body}", response.StatusCode, err);
            yield return new ChatStreamEventDto
            {
                Type = "token",
                Content = "Sorry, I couldn't process that right now. Please try again."
            };
            yield return new ChatStreamEventDto { Type = "done" };
            yield break;
        }

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var reader = new StreamReader(stream);

        var fullReplyBuilder = new StringBuilder();
        var streamedVisibleTextBuilder = new StringBuilder();
        var pendingBuffer = new StringBuilder();
        bool insideTag = false;
        string? line;

        while ((line = await reader.ReadLineAsync(cancellationToken)) != null)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;

            if (line.StartsWith("data: "))
            {
                var data = line.Substring("data: ".Length).Trim();
                if (data == "[DONE]") break;

                var tokensToEmit = new List<string>();

                try
                {
                    using var doc = JsonDocument.Parse(data);
                    var choices = doc.RootElement.GetProperty("choices");
                    if (choices.GetArrayLength() > 0)
                    {
                        var delta = choices[0].GetProperty("delta");
                        if (delta.TryGetProperty("content", out var contentProp))
                        {
                            var token = contentProp.GetString();
                            if (!string.IsNullOrEmpty(token))
                            {
                                fullReplyBuilder.Append(token);
                                pendingBuffer.Append(token);

                                while (pendingBuffer.Length > 0)
                                {
                                    var bufferStr = pendingBuffer.ToString();

                                    if (insideTag)
                                    {
                                        var closeIdx = bufferStr.IndexOf(']');
                                        if (closeIdx != -1)
                                        {
                                            insideTag = false;
                                            pendingBuffer.Remove(0, closeIdx + 1);
                                        }
                                        else
                                        {
                                            break;
                                        }
                                    }
                                    else
                                    {
                                        var openIdx = bufferStr.IndexOf('[');
                                        if (openIdx == -1)
                                        {
                                            var toEmit = bufferStr;
                                            pendingBuffer.Clear();
                                            streamedVisibleTextBuilder.Append(toEmit);
                                            tokensToEmit.Add(toEmit);
                                        }
                                        else if (openIdx > 0)
                                        {
                                            var toEmit = bufferStr.Substring(0, openIdx);
                                            pendingBuffer.Remove(0, openIdx);
                                            streamedVisibleTextBuilder.Append(toEmit);
                                            tokensToEmit.Add(toEmit);
                                        }
                                        else
                                        {
                                            if (bufferStr.StartsWith("[SUBMIT_", StringComparison.OrdinalIgnoreCase) ||
                                                "[SUBMIT_BOOKING:".StartsWith(bufferStr, StringComparison.OrdinalIgnoreCase) ||
                                                "[SUBMIT_ENQUIRY:".StartsWith(bufferStr, StringComparison.OrdinalIgnoreCase))
                                            {
                                                var closeIdx = bufferStr.IndexOf(']');
                                                if (closeIdx != -1)
                                                {
                                                    pendingBuffer.Remove(0, closeIdx + 1);
                                                }
                                                else
                                                {
                                                    if (bufferStr.StartsWith("[SUBMIT_", StringComparison.OrdinalIgnoreCase))
                                                    {
                                                        insideTag = true;
                                                    }
                                                    break;
                                                }
                                            }
                                            else
                                            {
                                                var toEmit = bufferStr.Substring(0, 1);
                                                pendingBuffer.Remove(0, 1);
                                                streamedVisibleTextBuilder.Append(toEmit);
                                                tokensToEmit.Add(toEmit);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                catch (JsonException)
                {
                    // Ignore SSE frame JSON glitches
                }

                foreach (var t in tokensToEmit)
                {
                    yield return new ChatStreamEventDto
                    {
                        Type = "token",
                        Content = t
                    };
                }
            }
        }

        if (!insideTag && pendingBuffer.Length > 0)
        {
            var remainder = pendingBuffer.ToString().Trim('`', '\'', '"', '\n', '\r');
            if (!string.IsNullOrWhiteSpace(remainder) && !remainder.StartsWith("[SUBMIT_", StringComparison.OrdinalIgnoreCase))
            {
                streamedVisibleTextBuilder.Append(remainder);
                yield return new ChatStreamEventDto
                {
                    Type = "token",
                    Content = remainder
                };
            }
        }

        var fullReply = fullReplyBuilder.ToString();
        var enquiryMatch = GenericEnquiryTagRegex.Match(fullReply);
        var enquirySubmitted = false;
        string? submittedEnquiryName = null;
        string? submittedEnquiryPhone = null;
        string? submittedEnquiryProduct = null;
        string? submittedEnquiryMessage = null;

        if (enquiryMatch.Success)
        {
            var dict = ParseTagKeyValues(enquiryMatch.Groups[1].Value);
            dict.TryGetValue("name", out var name);
            dict.TryGetValue("phone", out var phone);
            dict.TryGetValue("message", out var msg);
            dict.TryGetValue("productid", out var tagProductIdStr);
            dict.TryGetValue("product", out var tagProductName);

            var finalMessage = !string.IsNullOrWhiteSpace(msg) && !msg.EndsWith("?") ? msg.Trim() : request.Message.Trim();

            submittedEnquiryName = name;
            submittedEnquiryPhone = phone;
            submittedEnquiryProduct = tagProductName;
            submittedEnquiryMessage = finalMessage;

            int? resolvedProductId = null;
            if (!string.IsNullOrWhiteSpace(tagProductIdStr) && int.TryParse(tagProductIdStr, out var pid))
            {
                resolvedProductId = pid;
            }

            if (!string.IsNullOrWhiteSpace(tagProductName))
            {
                try
                {
                    if (resolvedProductId.HasValue)
                    {
                        var p = await _productService.GetProductByIdAsync(resolvedProductId.Value);
                        if (p == null || (!p.ProductName.Contains(tagProductName, StringComparison.OrdinalIgnoreCase) && !tagProductName.Contains(p.ProductName, StringComparison.OrdinalIgnoreCase)))
                        {
                            resolvedProductId = null;
                        }
                    }

                    if (!resolvedProductId.HasValue)
                    {
                        var allProducts = await _productService.GetProductsAsync(null, null, null, false);
                        var match = allProducts.FirstOrDefault(p =>
                            p.ProductName.Equals(tagProductName, StringComparison.OrdinalIgnoreCase) ||
                            tagProductName.Contains(p.ProductName, StringComparison.OrdinalIgnoreCase) ||
                            p.ProductName.Contains(tagProductName, StringComparison.OrdinalIgnoreCase));
                        if (match != null)
                        {
                            resolvedProductId = match.ProductId;
                        }
                    }
                }
                catch { }
            }

            if (!resolvedProductId.HasValue && !string.IsNullOrWhiteSpace(request.CurrentPath))
            {
                var segments = request.CurrentPath.Trim().Trim('/').Split('/');
                if (segments.Length >= 2 && segments[0].Equals("products", StringComparison.OrdinalIgnoreCase))
                {
                    var idPart = segments[1].Split('?')[0].Split('#')[0].Trim();
                    if (int.TryParse(idPart, out var pathPid))
                    {
                        resolvedProductId = pathPid;
                    }
                }
            }

            var subject = "AI Chatbot Enquiry";
            if (resolvedProductId.HasValue)
            {
                try
                {
                    var product = await _productService.GetProductByIdAsync(resolvedProductId.Value);
                    if (product != null)
                    {
                        subject = $"Product Enquiry: {product.ProductName} (#{product.ProductId})";
                    }
                    else if (!string.IsNullOrWhiteSpace(tagProductName))
                    {
                        subject = $"Product Enquiry: {tagProductName} (#{resolvedProductId.Value})";
                    }
                }
                catch
                {
                    if (!string.IsNullOrWhiteSpace(tagProductName))
                    {
                        subject = $"Product Enquiry: {tagProductName}";
                    }
                }
            }
            else if (!string.IsNullOrWhiteSpace(tagProductName))
            {
                subject = $"Product Enquiry: {tagProductName}";
            }

            if (!string.IsNullOrWhiteSpace(name) && !string.IsNullOrWhiteSpace(phone) && !string.IsNullOrWhiteSpace(finalMessage))
            {
                try
                {
                    await _enquiryService.CreateAsync(new CreateEnquiryDto
                    {
                        ProductId = resolvedProductId,
                        FullName = name.Trim(),
                        PhoneNumber = phone.Trim(),
                        Message = finalMessage,
                        Subject = subject
                    });
                    enquirySubmitted = true;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to submit enquiry via chatbot.");
                }
            }
        }

        var bookingMatch = GenericBookingTagRegex.Match(fullReply);
        var bookingSubmitted = false;
        string? bookingTrackingNumber = null;
        string? submittedBookingName = null;
        string? submittedBookingPhone = null;
        string? submittedBookingDevice = null;
        string? submittedBookingIssue = null;
        string? submittedBookingServiceType = null;
        string? submittedBookingAddress = null;

        if (bookingMatch.Success)
        {
            var dict = ParseTagKeyValues(bookingMatch.Groups[1].Value);
            dict.TryGetValue("name", out var name);
            dict.TryGetValue("phone", out var phone);
            dict.TryGetValue("device", out var device);
            dict.TryGetValue("category", out var categoryName);
            dict.TryGetValue("issue", out var issue);
            dict.TryGetValue("servicetype", out var serviceType);
            dict.TryGetValue("address", out var address);

            name ??= "";
            phone ??= "";
            device ??= "";
            categoryName ??= "TV Repair";
            issue = string.IsNullOrWhiteSpace(issue) ? "Booked via AI Chatbot" : issue;
            serviceType ??= "Shop Repair";

            submittedBookingName = name;
            submittedBookingPhone = phone;
            submittedBookingDevice = device;
            submittedBookingIssue = issue;
            submittedBookingAddress = address;
            submittedBookingServiceType = serviceType.Contains("home", StringComparison.OrdinalIgnoreCase) ? "Home Visit" : "Shop Drop-off";

            if (!string.IsNullOrWhiteSpace(name) && !string.IsNullOrWhiteSpace(phone) && !string.IsNullOrWhiteSpace(device))
            {
                try
                {
                    var serviceCategories = await _lookUpService.GetServiceCategoriesAsync();
                    var matchedCategory = serviceCategories.FirstOrDefault(c =>
                        !string.IsNullOrWhiteSpace(c.Name) && categoryName.Contains(c.Name, StringComparison.OrdinalIgnoreCase)
                    ) ?? serviceCategories.FirstOrDefault();

                    var locations = await _lookUpService.GetServiceLocationAsync();
                    var matchedLocation = locations.FirstOrDefault();

                    var normalizedServiceType = serviceType.Contains("home", StringComparison.OrdinalIgnoreCase)
                        ? "Home Visit"
                        : "Shop Repair";

                    var result = await _serviceRequestService.CreateAsync(new CreateServiceRequestDto
                    {
                        CustomerName = name.Trim(),
                        PhoneNumber = phone.Trim(),
                        ServiceCategoryId = matchedCategory?.Id ?? 1,
                        ServiceLocationId = normalizedServiceType == "Home Visit" ? (matchedLocation?.Id ?? 1) : null,
                        DeviceName = device.Trim(),
                        IssueDescription = issue.Trim(),
                        ServiceType = normalizedServiceType,
                        VisitAddress = normalizedServiceType == "Home Visit" ? (!string.IsNullOrWhiteSpace(address) ? address.Trim() : "Address to be confirmed by phone") : null
                    });

                    bookingSubmitted = true;
                    if (!string.IsNullOrWhiteSpace(result.RequestNumber))
                    {
                        bookingTrackingNumber = result.RequestNumber;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to create service request via chatbot.");
                }
            }
        }

        var visibleText = streamedVisibleTextBuilder.ToString().Trim();

        if (enquirySubmitted)
        {
            var pName = !string.IsNullOrWhiteSpace(submittedEnquiryProduct) ? submittedEnquiryProduct : "Electronics Enquiry";
            var summaryCard = $"\n\n📋 **Enquiry Summary:**\n• **Product**: {pName}\n• **Customer**: {submittedEnquiryName}\n• **Phone**: {submittedEnquiryPhone}\n• **Message**: {submittedEnquiryMessage ?? "General Enquiry"}\n• **Status**: Received — Our team will contact you shortly.";

            if (string.IsNullOrWhiteSpace(visibleText))
            {
                yield return new ChatStreamEventDto
                {
                    Type = "token",
                    Content = $"✅ **Enquiry Submitted Successfully!**{summaryCard}"
                };
            }
            else if (!visibleText.Contains("Enquiry Summary", StringComparison.OrdinalIgnoreCase))
            {
                yield return new ChatStreamEventDto
                {
                    Type = "token",
                    Content = summaryCard
                };
            }
        }
        else if (bookingSubmitted)
        {
            var addrLine = submittedBookingServiceType == "Home Visit" && !string.IsNullOrWhiteSpace(submittedBookingAddress) && submittedBookingAddress != "Shop Drop-off" ? $" — {submittedBookingAddress}" : "";
            var bookingCard = $"\n\n✅ **Repair Request Booked Successfully!**\n\n📋 **Booking Summary:**\n• **Tracking Number**: `{bookingTrackingNumber}`\n• **Customer**: {submittedBookingName} ({submittedBookingPhone})\n• **Device**: {submittedBookingDevice}\n• **Issue**: {submittedBookingIssue ?? "Repairs required"}\n• **Service Type**: {submittedBookingServiceType}{addrLine}\n• **Status**: Received — Technician assigned shortly.";

            if (string.IsNullOrWhiteSpace(visibleText) || !visibleText.Contains("Booking Summary", StringComparison.OrdinalIgnoreCase))
            {
                yield return new ChatStreamEventDto
                {
                    Type = "token",
                    Content = bookingCard
                };
            }
            else if (!visibleText.Contains(bookingTrackingNumber ?? ""))
            {
                yield return new ChatStreamEventDto
                {
                    Type = "token",
                    Content = $"\n\n📋 **Official Tracking Number**: `{bookingTrackingNumber}`"
                };
            }
        }
        else if (string.IsNullOrWhiteSpace(visibleText))
        {
            yield return new ChatStreamEventDto
            {
                Type = "token",
                Content = "I've noted that! How else can I assist you with our electronics or repair services today?"
            };
        }

        var shopSettings = await _cacheService.GetOrCreateAsync(
            "chatbot:shop-settings",
            () => _settingsRepository.GetSettingsAsync(),
            TimeSpan.FromMinutes(1)
        );

        var shopPhone = !string.IsNullOrWhiteSpace(shopSettings?.PrimaryPhone)
            ? shopSettings.PrimaryPhone
            : "+91 98200 00000";

        var actions = new List<ChatActionDto>();
        var lowerMsg = NormalizeMessage(request.Message);
        var lowerReply = fullReply.ToLowerInvariant();

        if (enquirySubmitted || bookingSubmitted)
        {
            if (bookingSubmitted)
            {
                actions.Add(new ChatActionDto { Label = "Track Repair", Url = "/track-request", Icon = "search" });
                actions.Add(new ChatActionDto { Label = "Call Shop", Url = $"tel:{shopPhone}", Icon = "phone" });
            }
            else if (enquirySubmitted)
            {
                actions.Add(new ChatActionDto { Label = "Call Shop", Url = $"tel:{shopPhone}", Icon = "phone" });
                actions.Add(new ChatActionDto { Label = "Browse Products", Url = "/products", Icon = "package" });
            }
        }
        else
        {
            var productKeywords = new[] { "product", "buy", "price", "stock", "tv", "remote", "speaker", "adapter", "available", "cost", "sale", "offer" };
            var isProductRelated = productKeywords.Any(k => lowerMsg.Contains(k) || lowerReply.Contains(k));

            var trackKeywords = new[] { "track", "status" };
            var isTrackRelated = trackKeywords.Any(k => lowerMsg.Contains(k) || lowerReply.Contains(k));

            if (isProductRelated || (matchedProducts != null && matchedProducts.Any()))
            {
                actions.Add(new ChatActionDto { Label = "Browse Products", Url = "/products", Icon = "package" });
            }

            if (isTrackRelated)
            {
                actions.Add(new ChatActionDto { Label = "Track Repair", Url = "/track-request", Icon = "search" });
            }

            if (lowerMsg.Contains("contact") || lowerMsg.Contains("call") || lowerMsg.Contains("phone") || lowerMsg.Contains("location") || lowerMsg.Contains("address"))
            {
                actions.Add(new ChatActionDto { Label = "Call Shop", Url = $"tel:{shopPhone}", Icon = "phone" });
            }
        }

        yield return new ChatStreamEventDto
        {
            Type = "metadata",
            Products = (!enquirySubmitted && !bookingSubmitted && matchedProducts?.Any() == true) ? matchedProducts : null,
            Actions = actions.Any() ? actions.DistinctBy(a => a.Label).ToList() : null
        };

        yield return new ChatStreamEventDto { Type = "done" };
    }

    private async Task<(string Context, List<ChatProductCardDto> Products)> BuildGroundingContextAsync(string message, string? currentPath = null, int? appUserId = null)
    {
        var sb = new StringBuilder();
        var productCards = new List<ChatProductCardDto>();

        var shopSettings = await _cacheService.GetOrCreateAsync(
            "chatbot:shop-settings",
            () => _settingsRepository.GetSettingsAsync(),
            TimeSpan.FromMinutes(1)
        );

        if (shopSettings != null)
        {
            sb.AppendLine($"- Shop: {shopSettings.ShopName}, {shopSettings.Area}, {shopSettings.City}");
            sb.AppendLine($"- Owner Name: {shopSettings.OwnerName}");
            sb.AppendLine($"- Contact: {shopSettings.PrimaryPhone}");
            sb.AppendLine($"- Home visit info: {shopSettings.HomeVisitMessage}");
            sb.AppendLine($"- Hours: {shopSettings.OpeningHours}");
            sb.AppendLine($"- Booking notice: {shopSettings.BookingNotice}");
            sb.AppendLine($"- Local service radius: {shopSettings.LocalServiceRadiusKm} km");
        }
        if (appUserId.HasValue)
        {
            try
            {
                var customer = await _dbContext.Customers
                    .AsNoTracking()
                    .Where(c => c.AppUserId == appUserId.Value && c.DeletedAt == null && c.IsActive)
                    .Select(c => new
                    {
                        c.CustomerId,
                        c.FullName,
                        c.PhoneNumber,
                        c.Email,
                        Repairs = c.ServiceRequests
                            .Where(r => r.DeletedAt == null)
                            .OrderByDescending(r => r.CreatedAt)
                            .Take(3)
                            .Select(r => new
                            {
                                r.RequestNumber,
                                r.DeviceName,
                                Status = r.CurrentStatus.StatusName,
                                r.CreatedAt
                            })
                            .ToList()
                    })
                    .FirstOrDefaultAsync();

                if (customer != null)
                {
                    sb.AppendLine("- Authenticated Customer Profile (Active Signed-In User):");
                    sb.AppendLine($"  - Name: {customer.FullName}");
                    sb.AppendLine($"  - Phone: {customer.PhoneNumber}");
                    if (!string.IsNullOrWhiteSpace(customer.Email))
                    {
                        sb.AppendLine($"  - Email: {customer.Email}");
                    }

                    if (customer.Repairs.Any())
                    {
                        sb.AppendLine("  - Customer's Recent & Active Repair Requests:");
                        foreach (var rep in customer.Repairs)
                        {
                            sb.AppendLine($"    * #{rep.RequestNumber} - {rep.DeviceName} (Status: {rep.Status}, Created: {rep.CreatedAt:dd MMM yyyy})");
                        }
                    }
                }
                else
                {
                    var appUser = await _dbContext.AppUsers
                        .AsNoTracking()
                        .Where(u => u.AppUserId == appUserId.Value && u.DeletedAt == null && u.IsActive)
                        .Select(u => new { u.FullName, u.PhoneNumber, u.Email })
                        .FirstOrDefaultAsync();

                    if (appUser != null)
                    {
                        sb.AppendLine("- Authenticated Customer Profile (Active Signed-In User):");
                        sb.AppendLine($"  - Name: {appUser.FullName}");
                        if (!string.IsNullOrWhiteSpace(appUser.PhoneNumber))
                        {
                            sb.AppendLine($"  - Phone: {appUser.PhoneNumber}");
                        }
                        if (!string.IsNullOrWhiteSpace(appUser.Email))
                        {
                            sb.AppendLine($"  - Email: {appUser.Email}");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load authenticated user profile in chatbot grounding.");
            }
        }

        int viewingProductId = 0;

        if (!string.IsNullOrWhiteSpace(currentPath))
        {
            var cleanPath = currentPath.Trim().Trim('/');
            var segments = cleanPath.Split('/');
            if (segments.Length >= 2 && segments[0].Equals("products", StringComparison.OrdinalIgnoreCase))
            {
                var idPart = segments[1].Split('?')[0].Split('#')[0].Trim();
                if (int.TryParse(idPart, out viewingProductId))
                {
                    try
                    {
                        var product = await _productService.GetProductByIdAsync(viewingProductId);
                        if (product != null)
                        {
                            sb.AppendLine($"- Currently Viewed Product Page (Product #{product.ProductId}):");
                            sb.AppendLine($"  - Title: {product.ProductName}");
                            sb.AppendLine($"  - Brand: {product.Brand ?? "N/A"} | Model: {product.ModelName ?? "N/A"}");
                            sb.AppendLine($"  - Category: {product.CategoryName} | Condition: {product.ConditionName}");
                            sb.AppendLine($"  - Price: ₹{product.Price:N0}");
                            sb.AppendLine($"  - Stock Status: {(product.IsAvailable ? "In Stock" : "Out of Stock")} ({product.StockQuantity} available)");
                            sb.AppendLine($"  - Features & Description: {(string.IsNullOrWhiteSpace(product.Description) ? "Tested and certified by Tanish Electronics." : product.Description)}");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to load viewed product details for Product #{ProductId}", viewingProductId);
                    }
                }
            }
            else if (cleanPath.Equals("book-repair", StringComparison.OrdinalIgnoreCase))
            {
                sb.AppendLine("- User is currently on the Book a Repair page.");
            }
            else if (cleanPath.Equals("products", StringComparison.OrdinalIgnoreCase))
            {
                sb.AppendLine("- User is currently browsing the Products catalog page.");
            }
            else if (cleanPath.Equals("track-request", StringComparison.OrdinalIgnoreCase))
            {
                sb.AppendLine("- User is currently on the Track Repair page.");
            }
        }
        var lowerMessage = NormalizeMessage(message);

        var normalizedForRegex = message
            .Replace('\u2013', '-')
            .Replace('\u2014', '-')
            .Replace('\u2010', '-');

        var requestNumberMatch = RequestNumberPattern.Match(normalizedForRegex);
        var phoneNumberMatch = PhoneNumberPattern.Match(normalizedForRegex);
        var mentionsTracking = TrackingKeywords.Any(k => lowerMessage.Contains(k));

        if (requestNumberMatch.Success && phoneNumberMatch.Success)
        {
            try
            {
                var tracking = await _serviceRequestService.TrackAsync(new TrackServiceRequestDto
                {
                    RequestNumber = requestNumberMatch.Value.ToUpperInvariant(),
                    PhoneNumber = phoneNumberMatch.Value
                });

                sb.AppendLine($"- Repair request {tracking.RequestNumber} found:");
                sb.AppendLine($"  - Status: {tracking.CurrentStatus}");
                sb.AppendLine($"  - Device: {tracking.DeviceName} {tracking.Brand} {tracking.ModelName}".Trim());
                sb.AppendLine($"  - Service type: {tracking.ServiceType}");
                if (tracking.EstimatedPrice.HasValue)
                    sb.AppendLine($"  - Estimated price: ₹{tracking.EstimatedPrice}");
                if (tracking.FinalPrice.HasValue)
                    sb.AppendLine($"  - Final price: ₹{tracking.FinalPrice}");
            }
            catch (InvalidOperationException)
            {
                sb.AppendLine("- The customer provided a request number and phone number, but no matching repair request was found. Tell them to double check both values, or use the Track Repair page.");
            }
        }
        else if (mentionsTracking && (requestNumberMatch.Success || phoneNumberMatch.Success))
        {
            var missing = requestNumberMatch.Success ? "phone number" : "request number";
            sb.AppendLine($"- The customer is trying to track a repair but only provided one piece of info. Ask them for their {missing} to proceed (both are required for privacy).");
        }
        else if (mentionsTracking)
        {
            sb.AppendLine("- The customer wants to track a repair but hasn't given a request number or phone number yet. Ask for both.");
        }

        var repairKeywords = new[] { "repair", "fix", "broken", "issue", "not working", "service", "book" };
        var isRepairQuery = repairKeywords.Any(k => lowerMessage.Contains(k));

        var catergoryLookUps = await _cacheService.GetOrCreateAsync(
            "chatbot:product-categories",
            () => _lookUpService.GetProductCategoriesAsync(),
            TimeSpan.FromMinutes(10)
        );

        var productCategories = catergoryLookUps
            .Where(c => !string.IsNullOrWhiteSpace(c.Name))
            .Select(c => c.Name!.ToLowerInvariant())
            .ToList();

        var isAskingAboutCurrentProduct = viewingProductId > 0 &&
            (lowerMessage.Contains("this") || lowerMessage.Contains("feature") || lowerMessage.Contains("spec") || lowerMessage.Contains("warranty") || lowerMessage.Contains("price") || lowerMessage.Contains("cost") || lowerMessage.Contains("about") || lowerMessage.Contains("what"));

        var announcementKeywords = new[] { "announcement", "notice", "news", "update", "initiative", "offer", "discount", "sale" };
        var isAnnouncementQuery = announcementKeywords.Any(k => lowerMessage.Contains(k));

        var reviewKeywords = new[] { "review", "feedback", "rating", "testimonial" };
        var isReviewQuery = reviewKeywords.Any(k => lowerMessage.Contains(k));

        var specificItem = productCategories.FirstOrDefault(k => lowerMessage.Contains(k));

        if (string.IsNullOrEmpty(specificItem))
        {
            var genericKeywords = new[] { "tv", "remote", "speaker", "theatre", "adapter", "cable", "battery" };
            specificItem = genericKeywords.FirstOrDefault(k => lowerMessage.Contains(k));
        }

        var generalProductKeywords = new[] { "product", "products", "item", "items", "buy", "purchase", "for sale", "in stock" };
        var hasGeneralKeyword = generalProductKeywords.Any(k => lowerMessage.Contains(k));

        var isProductQuery = (specificItem != null || hasGeneralKeyword)
            && !isRepairQuery
            && !isAskingAboutCurrentProduct
            && !isAnnouncementQuery
            && !isReviewQuery
            && !mentionsTracking;

        if (isProductQuery)
        {
            var brands = new[] { "lg", "samsung", "sony", "vu", "mi", "xiaomi", "oneplus", "tcl", "panasonic", "philips", "nxt" };
            var matchedBrand = brands.FirstOrDefault(b => lowerMessage.Contains(b));

            string? searchKeyword = null;
            if (!string.IsNullOrEmpty(matchedBrand) && !string.IsNullOrEmpty(specificItem))
            {
                searchKeyword = $"{matchedBrand} {specificItem}";
            }
            else if (!string.IsNullOrEmpty(matchedBrand))
            {
                searchKeyword = matchedBrand;
            }
            else
            {
                searchKeyword = specificItem;
            }

            var products = await _productService.GetProductsAsync
            (
                categoryId: null, conditionId: null, search: searchKeyword, featuredOnly: false
            );

            if (!products.Any() && !string.IsNullOrEmpty(specificItem) && searchKeyword != specificItem)
            {
                products = await _productService.GetProductsAsync
                (
                    categoryId: null, conditionId: null, search: specificItem, featuredOnly: false
                );
            }

            var topMatches = products.Where(p => p.IsAvailable && p.StockQuantity > 0).Take(5).ToList();
            if (topMatches.Any())
            {
                sb.AppendLine("- Currently available products (sample):");
                foreach (var p in topMatches)
                {
                    var brandInfo = string.IsNullOrWhiteSpace(p.Brand) ? "" : $" ({p.Brand})";
                    sb.AppendLine($"  - [Product #{p.ProductId}] {p.ProductName}{brandInfo} — ₹{p.Price:N0}, {p.StockQuantity} in stock, condition: {p.ConditionName}");
                    productCards.Add(new ChatProductCardDto
                    {
                        ProductId = p.ProductId,
                        ProductName = p.ProductName,
                        CategoryName = p.CategoryName,
                        ConditionName = p.ConditionName,
                        Price = p.Price,
                        IsAvailable = p.IsAvailable,
                        PrimaryImageUrl = p.PrimaryImageUrl
                    });
                }
            }
            else
            {
                sb.AppendLine("— No matching products currently in stock.");
            }
        }

        // --- Active Announcements (offers, sales, notices) ---
        try
        {
            var homepageAnnouncements = await _cacheService.GetOrCreateAsync(
                "chatbot:announcements:homepage",
                () => _announcementService.GetPublicAnnouncementAsync("Homepage", "All", 5),
                TimeSpan.FromMinutes(2)
            );

            var allPagesAnnouncements = await _cacheService.GetOrCreateAsync(
                "chatbot:announcements:allpages",
                () => _announcementService.GetPublicAnnouncementAsync("AllPublicPages", "All", 5),
                TimeSpan.FromMinutes(2)
            );

            var combined = (homepageAnnouncements ?? new List<PublicAnnouncementDto>())
                .Concat(allPagesAnnouncements ?? new List<PublicAnnouncementDto>())
                .DistinctBy(a => a.AnnouncementId)
                .ToList();

            if (combined.Any())
            {
                sb.AppendLine("- Active Announcements & Shop Notices:");
                foreach (var a in combined)
                {
                    var endInfo = a.EndAt.HasValue ? $" (valid until {a.EndAt.Value:dd MMM yyyy})" : "";
                    sb.AppendLine($"  - [{a.AnnouncementType}] Title: \"{a.Title}\" | Notice: \"{a.Message}\"{endInfo}");
                }
            }
            else
            {
                sb.AppendLine("- No active announcements or offers right now.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load announcements for chatbot grounding.");
        }

        // --- Customer Reviews / Feedbacks ---
        try
        {
            var feedbacks = await _cacheService.GetOrCreateAsync(
                "chatbot:feedbacks",
                () => _feedbackService.GetPublicFeedbacksAsync(5),
                TimeSpan.FromMinutes(5)
            );

            if (feedbacks != null && feedbacks.Any())
            {
                var avgRating = feedbacks.Average(f => f.Rating);
                sb.AppendLine($"- Customer Reviews (average {avgRating:F1}/5 from recent reviews):");
                foreach (var f in feedbacks)
                {
                    sb.AppendLine($"  - \"{f.Comment}\" — {f.CustomerName} ({f.Rating}★, {f.ServiceCategory})");
                }
            }
            else
            {
                sb.AppendLine("- No customer reviews available yet.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load feedbacks for chatbot grounding.");
        }

        // --- Service Categories (what repairs are offered) ---
        var serviceCategories = await _cacheService.GetOrCreateAsync(
            "chatbot:service-categories",
            () => _lookUpService.GetServiceCategoriesAsync(),
            TimeSpan.FromMinutes(10)
        );

        if (serviceCategories != null && serviceCategories.Any())
        {
            var categoryNames = serviceCategories
                .Where(c => !string.IsNullOrWhiteSpace(c.Name))
                .Select(c => c.Name!)
                .ToList();
            sb.AppendLine($"- Repair service categories we offer: {string.Join(", ", categoryNames)}");
        }

        // --- Home Visit Areas ---
        var serviceLocations = await _cacheService.GetOrCreateAsync(
            "chatbot:service-locations",
            () => _lookUpService.GetServiceLocationAsync(),
            TimeSpan.FromMinutes(10)
        );

        if (serviceLocations != null && serviceLocations.Any())
        {
            var locationNames = serviceLocations
                .Where(l => !string.IsNullOrWhiteSpace(l.Name))
                .Select(l => l.Name!)
                .ToList();
            sb.AppendLine($"- Home visit available in: {string.Join(", ", locationNames)}");
        }

        // --- Product Categories & Conditions ---
        if (productCategories.Any())
        {
            sb.AppendLine($"- Product categories we sell: {string.Join(", ", productCategories.Select(c => string.IsNullOrEmpty(c) ? c : char.ToUpper(c[0]) + c[1..]))}");
        }

        var productConditions = await _cacheService.GetOrCreateAsync(
            "chatbot:product-conditions",
            () => _lookUpService.GetProductConditionsAsync(),
            TimeSpan.FromMinutes(10)
        );

        if (productConditions != null && productConditions.Any())
        {
            var conditionNames = productConditions
                .Where(c => !string.IsNullOrWhiteSpace(c.Name))
                .Select(c => c.Name!)
                .ToList();
            sb.AppendLine($"- Product conditions available: {string.Join(", ", conditionNames)}");
        }

        return (sb.ToString(), productCards);
    }
}