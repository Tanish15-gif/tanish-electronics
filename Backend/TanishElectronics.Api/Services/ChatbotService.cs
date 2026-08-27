using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;
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
        IEnquiryService enquiryService
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

    private static readonly Regex EnquiryTagPattern =
        new(@"\[SUBMIT_ENQUIRY:\s*name=([^|]+)\s*\|\s*phone=([^|]+)\s*\|\s*message=([^\]|]+)(?:\s*\|\s*productid=([^\]|]+))?(?:\s*\|\s*product=([^\]]+))?\]", RegexOptions.IgnoreCase);

    private static readonly Regex BookingTagPattern =
        new(@"\[SUBMIT_BOOKING:\s*name=([^|]+)\s*\|\s*phone=([^|]+)\s*\|\s*category=([^|]+)\s*\|\s*device=([^|]+)\s*\|\s*issue=([^|]+)\s*\|\s*servicetype=([^|]+)(?:\s*\|\s*address=([^\]]+))?\]", RegexOptions.IgnoreCase);

    private static readonly Regex RequestNumberPattern =
        new(@"\bTE-\d{4}-\d{3,6}\b", System.Text.RegularExpressions.RegexOptions.IgnoreCase);

    private static readonly Regex PhoneNumberPattern =
        new(@"\b\d{10}\b");

    private static readonly string[] TrackingKeywords =
        { "track", "status", "where's my", "where is my", "my repair", "my request" };

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
        You are the customer support assistant for Tanish Electronics, a trusted TV and electronics repair and sales shop.

        Rules:
            - Only answer questions about repairs, products, shop info, announcements, reviews, service areas, or booking guidance.
            - If asked something unrelated, politely redirect: "I can help with repairs, products, and shop info — what do you need?"
            - Never invent prices, stock, repair statuses, reviews, or offers. Only state facts from "Shop Data" below.
            - Keep responses short, clear, and warm — 1-3 sentences maximum. No filler words.
            - If the customer is asking about features, specs, warranty, price, or details of a product (especially the one they are currently viewing on the page), answer their question directly, thoroughly, and concisely using the Product Details in Shop Data.
            - If the customer is generally searching or looking to buy products (e.g., "show me TVs", "do you sell remotes?") and products are in stock, say "Here are some options we currently have:" and let the UI display the product cards.
            - If the Shop Data says "No matching products currently in stock", tell the customer directly that you do not have it currently.
            - If asked about warranty and it is not specifically noted, state that all pre-owned/refurbished electronics are fully tested and inspected by Tanish Electronics, and warranty/check details can be confirmed with the shop.
            - If the customer describes a device issue and wants to book directly via chat, guide them to book or encourage them to click "Book a Repair".
            - If the customer's message is completely ambiguous (e.g., they just type "tv") AND no products are listed in Shop Data, ask a short clarifying question (e.g. "Are you looking to buy one, or is your current one having an issue?").
            - You already have all the information you need in "Shop Data" below — never say "let me check" or "please hold on". Answer directly.
            - If asked about current offers, sales, notices, updates, or announcements:
              Present the active announcements and shop notices smoothly and cleanly.
              Format them naturally, for example:
              "Yes! We have an active update:
              **[Title]**
              [Notice message]
              *(Valid until [Date])*"
              Never output rigid technical labels like "**Title:**", "**Notice:**", or "**Validity:**".
              If there are no active announcements in Shop Data, say "We don't have any active announcements right now, but check back soon!"
            - If asked about reviews, quality, or trustworthiness, cite the customer feedback data and average rating from Shop Data.
            - If asked what repairs you offer, list the service categories from Shop Data.
            - If asked about home visits or service areas, list the specific locations from Shop Data.
            - If a customer wants to send an enquiry, buy/order an item, request a callback, or asks us to contact them:
              1. If they provided their full name, 10-digit phone number, and their query/quantity:
                 - If they are enquiring about a specific product (e.g. from the Currently Viewed Product in Shop Data, or mentioned in chat), say you have submitted their enquiry for that product and append `[SUBMIT_ENQUIRY:name=Customer Name|phone=9876543210|message=Their query|productid=19|product=Product Name]` at the very end of your response (replace 19 and Product Name with the actual product ID and name).
                 - Otherwise, say you have submitted their general enquiry and append `[SUBMIT_ENQUIRY:name=Customer Name|phone=9876543210|message=Their query]` at the very end of your response.
              2. If they provided only some info (e.g. name only or phone only), ask for the missing details so we can submit the enquiry for them.
            - If a customer wants to book a repair directly in chat:
              1. When you have: customer name, 10-digit phone, device name/type, issue description, service type (Home Visit or Shop Repair), and address (if Home Visit), confirm it warmly and append `[SUBMIT_BOOKING:name=Name|phone=9876543210|category=TV Repair|device=Samsung 55 LED|issue=No display|servicetype=Home Visit|address=Flat 402 Santacruz West]` at the end of your response.
              2. Otherwise, guide them step-by-step to gather whatever is missing.

        Shop Knowledge Base (Treat these as absolute facts):
            - Owner / Founder: Tanish (If they ask to speak to the owner, say Tanish is usually available at the shop or via phone).
            - Experience: Backed by over 20 years of practical experience.
            - Service Areas: Based in Santacruz West, supporting home visits in nearby locations.
            - Specialties: Expert repair for LED, LCD, Smart TVs, and Box TVs.
            - Offerings: We offer shop repairs, home visits, online tracking, and we sell remotes, adapters, and refurbished items.

        Dynamic Shop Data:
        {groundingContext}
    """;

    public async Task<ChatResponseDto> GetReplyAsync(ChatRequestDto request)
    {
        var (groundingContext, matchedProducts) = await BuildGroundingContextAsync(request.Message, request.CurrentPath);
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

        var enquiryMatch = EnquiryTagPattern.Match(reply);
        var enquirySubmitted = false;

        if (enquiryMatch.Success)
        {
            var name = enquiryMatch.Groups[1].Value.Trim();
            var phone = enquiryMatch.Groups[2].Value.Trim();
            var msg = enquiryMatch.Groups[3].Value.Trim();
            var tagProductIdStr = enquiryMatch.Groups.Count > 4 && enquiryMatch.Groups[4].Success ? enquiryMatch.Groups[4].Value.Trim() : null;
            var tagProductName = enquiryMatch.Groups.Count > 5 && enquiryMatch.Groups[5].Success ? enquiryMatch.Groups[5].Value.Trim() : null;

            int? resolvedProductId = null;
            if (!string.IsNullOrWhiteSpace(tagProductIdStr) && int.TryParse(tagProductIdStr, out var pid))
            {
                resolvedProductId = pid;
            }
            else if (!string.IsNullOrWhiteSpace(request.CurrentPath) && request.CurrentPath.StartsWith("/products/"))
            {
                var segment = request.CurrentPath.Replace("/products/", "").Split('?')[0].Trim();
                if (int.TryParse(segment, out var pathPid))
                {
                    resolvedProductId = pathPid;
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

            if (!string.IsNullOrWhiteSpace(name) && !string.IsNullOrWhiteSpace(phone) && !string.IsNullOrWhiteSpace(msg))
            {
                try
                {
                    await _enquiryService.CreateAsync(new CreateEnquiryDto
                    {
                        ProductId = resolvedProductId,
                        FullName = name,
                        PhoneNumber = phone,
                        Message = msg,
                        Subject = subject
                    });
                    enquirySubmitted = true;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to submit enquiry via chatbot.");
                }
            }

            reply = EnquiryTagPattern.Replace(reply, "").Trim();
        }

        var bookingMatch = BookingTagPattern.Match(reply);
        var bookingSubmitted = false;
        string? bookedRequestNumber = null;

        if (bookingMatch.Success)
        {
            var name = bookingMatch.Groups[1].Value.Trim();
            var phone = bookingMatch.Groups[2].Value.Trim();
            var categoryName = bookingMatch.Groups[3].Value.Trim();
            var device = bookingMatch.Groups[4].Value.Trim();
            var issue = bookingMatch.Groups[5].Value.Trim();
            var serviceType = bookingMatch.Groups[6].Value.Trim();
            var address = bookingMatch.Groups[7].Success ? bookingMatch.Groups[7].Value.Trim() : null;

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
                        CustomerName = name,
                        PhoneNumber = phone,
                        ServiceCategoryId = matchedCategory?.Id ?? 1,
                        ServiceLocationId = normalizedServiceType == "Home Visit" ? (matchedLocation?.Id ?? 1) : null,
                        DeviceName = device,
                        IssueDescription = !string.IsNullOrWhiteSpace(issue) ? issue : "Booked via AI Chatbot",
                        ServiceType = normalizedServiceType,
                        VisitAddress = normalizedServiceType == "Home Visit" ? (!string.IsNullOrWhiteSpace(address) ? address : "Address to be confirmed by phone") : null
                    });

                    bookingSubmitted = true;
                    bookedRequestNumber = result.RequestNumber;
                    reply = BookingTagPattern.Replace(reply, "").Trim();
                    if (!string.IsNullOrWhiteSpace(bookedRequestNumber) && !reply.Contains(bookedRequestNumber))
                    {
                        reply += $"\n\n📋 Your tracking number is **{bookedRequestNumber}**.";
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to create service request via chatbot.");
                    reply = BookingTagPattern.Replace(reply, "").Trim();
                }
            }
            else
            {
                reply = BookingTagPattern.Replace(reply, "").Trim();
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
            var repairKeywords = new[] { "repair", "fix", "broken", "issue", "problem", "not working", "service", "book" };
            var isRepairRelated = repairKeywords.Any(k => lowerMsg.Contains(k) || lowerReply.Contains(k));

            var productKeywords = new[] { "product", "buy", "price", "stock", "tv", "remote", "speaker", "adapter", "available", "cost", "sale", "offer" };
            var isProductRelated = productKeywords.Any(k => lowerMsg.Contains(k) || lowerReply.Contains(k));

            var trackKeywords = new[] { "track", "status", "request" };
            var isTrackRelated = trackKeywords.Any(k => lowerMsg.Contains(k) || lowerReply.Contains(k));

            if (isRepairRelated)
            {
                actions.Add(new ChatActionDto { Label = "Book a Repair", Url = "/book-repair", Icon = "wrench" });
            }

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

    public async IAsyncEnumerable<ChatStreamEventDto> StreamReplyAsync(ChatRequestDto request, [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var (groundingContext, matchedProducts) = await BuildGroundingContextAsync(request.Message, request.CurrentPath);
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
        string? line;

        while ((line = await reader.ReadLineAsync(cancellationToken)) != null)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;

            if (line.StartsWith("data: "))
            {
                var data = line.Substring("data: ".Length).Trim();
                if (data == "[DONE]") break;

                string? tokenToYield = null;

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
                                var current = fullReplyBuilder.ToString();
                                var openBracketIdx = current.LastIndexOf('[');

                                if (openBracketIdx != -1)
                                {
                                    var potentialTag = current.Substring(openBracketIdx);
                                    var isTagPrefix = "[SUBMIT_BOOKING:".StartsWith(potentialTag, StringComparison.OrdinalIgnoreCase) ||
                                                      "[SUBMIT_ENQUIRY:".StartsWith(potentialTag, StringComparison.OrdinalIgnoreCase) ||
                                                      potentialTag.StartsWith("[SUBMIT_", StringComparison.OrdinalIgnoreCase);

                                    if (!isTagPrefix && !current.Contains("[SUBMIT_"))
                                    {
                                        tokenToYield = token;
                                    }
                                }
                                else if (!current.Contains("[SUBMIT_"))
                                {
                                    tokenToYield = token;
                                }
                            }
                        }
                    }
                }
                catch (JsonException)
                {
                    // Ignore SSE frame JSON glitches
                }

                if (!string.IsNullOrEmpty(tokenToYield))
                {
                    yield return new ChatStreamEventDto
                    {
                        Type = "token",
                        Content = tokenToYield
                    };
                }
            }
        }

        var fullReply = fullReplyBuilder.ToString();
        var enquiryMatch = EnquiryTagPattern.Match(fullReply);
        var enquirySubmitted = false;

        if (enquiryMatch.Success)
        {
            var name = enquiryMatch.Groups[1].Value.Trim();
            var phone = enquiryMatch.Groups[2].Value.Trim();
            var msg = enquiryMatch.Groups[3].Value.Trim();
            var tagProductIdStr = enquiryMatch.Groups.Count > 4 && enquiryMatch.Groups[4].Success ? enquiryMatch.Groups[4].Value.Trim() : null;
            var tagProductName = enquiryMatch.Groups.Count > 5 && enquiryMatch.Groups[5].Success ? enquiryMatch.Groups[5].Value.Trim() : null;

            int? resolvedProductId = null;
            if (!string.IsNullOrWhiteSpace(tagProductIdStr) && int.TryParse(tagProductIdStr, out var pid))
            {
                resolvedProductId = pid;
            }
            else if (!string.IsNullOrWhiteSpace(request.CurrentPath) && request.CurrentPath.StartsWith("/products/"))
            {
                var segment = request.CurrentPath.Replace("/products/", "").Split('?')[0].Trim();
                if (int.TryParse(segment, out var pathPid))
                {
                    resolvedProductId = pathPid;
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

            if (!string.IsNullOrWhiteSpace(name) && !string.IsNullOrWhiteSpace(phone) && !string.IsNullOrWhiteSpace(msg))
            {
                try
                {
                    await _enquiryService.CreateAsync(new CreateEnquiryDto
                    {
                        ProductId = resolvedProductId,
                        FullName = name,
                        PhoneNumber = phone,
                        Message = msg,
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

        var bookingMatch = BookingTagPattern.Match(fullReply);
        var bookingSubmitted = false;
        string? bookingTrackingNumber = null;

        if (bookingMatch.Success)
        {
            var name = bookingMatch.Groups[1].Value.Trim();
            var phone = bookingMatch.Groups[2].Value.Trim();
            var categoryName = bookingMatch.Groups[3].Value.Trim();
            var device = bookingMatch.Groups[4].Value.Trim();
            var issue = bookingMatch.Groups[5].Value.Trim();
            var serviceType = bookingMatch.Groups[6].Value.Trim();
            var address = bookingMatch.Groups[7].Success ? bookingMatch.Groups[7].Value.Trim() : null;

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
                        CustomerName = name,
                        PhoneNumber = phone,
                        ServiceCategoryId = matchedCategory?.Id ?? 1,
                        ServiceLocationId = normalizedServiceType == "Home Visit" ? (matchedLocation?.Id ?? 1) : null,
                        DeviceName = device,
                        IssueDescription = !string.IsNullOrWhiteSpace(issue) ? issue : "Booked via AI Chatbot",
                        ServiceType = normalizedServiceType,
                        VisitAddress = normalizedServiceType == "Home Visit" ? (!string.IsNullOrWhiteSpace(address) ? address : "Address to be confirmed by phone") : null
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

                if (!string.IsNullOrWhiteSpace(bookingTrackingNumber))
                {
                    yield return new ChatStreamEventDto
                    {
                        Type = "token",
                        Content = $"\n\n📋 Your tracking number is **{bookingTrackingNumber}**."
                    };
                }
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
            var repairKeywords = new[] { "repair", "fix", "broken", "issue", "problem", "not working", "service", "book" };
            var isRepairRelated = repairKeywords.Any(k => lowerMsg.Contains(k) || lowerReply.Contains(k));

            var productKeywords = new[] { "product", "buy", "price", "stock", "tv", "remote", "speaker", "adapter", "available", "cost", "sale", "offer" };
            var isProductRelated = productKeywords.Any(k => lowerMsg.Contains(k) || lowerReply.Contains(k));

            var trackKeywords = new[] { "track", "status", "request" };
            var isTrackRelated = trackKeywords.Any(k => lowerMsg.Contains(k) || lowerReply.Contains(k));

            if (isRepairRelated)
            {
                actions.Add(new ChatActionDto { Label = "Book a Repair", Url = "/book-repair", Icon = "wrench" });
            }

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

    private async Task<(string Context, List<ChatProductCardDto> Products)> BuildGroundingContextAsync(string message, string? currentPath = null)
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

        int viewingProductId = 0;

        // --- Current Page Context ---
        if (!string.IsNullOrWhiteSpace(currentPath))
        {
            if (currentPath.StartsWith("/products/") && int.TryParse(currentPath.Replace("/products/", "").Split('?')[0].Trim(), out viewingProductId))
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
                catch
                {
                    // Ignore page fetch error
                }
            }
            else if (currentPath.Equals("/book-repair", StringComparison.OrdinalIgnoreCase))
            {
                sb.AppendLine("- User is currently on the Book a Repair page.");
            }
            else if (currentPath.Equals("/products", StringComparison.OrdinalIgnoreCase))
            {
                sb.AppendLine("- User is currently browsing the Products catalog page.");
            }
            else if (currentPath.Equals("/track-request", StringComparison.OrdinalIgnoreCase))
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
            var products = await _productService.GetProductsAsync
            (
                categoryId: null, conditionId: null, search: specificItem, featuredOnly: false
            );

            var topMatches = products.Where(p => p.IsAvailable && p.StockQuantity > 0).Take(5).ToList();
            if (topMatches.Any())
            {
                sb.AppendLine("- Currently available products (sample):");
                foreach (var p in topMatches)
                {
                    var brandInfo = string.IsNullOrWhiteSpace(p.Brand) ? "" : $" ({p.Brand})";
                    sb.AppendLine($"  - {p.ProductName}{brandInfo} — ₹{p.Price}, {p.StockQuantity} in stock, condition: {p.ConditionName}");
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