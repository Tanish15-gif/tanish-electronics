using System.Text;
using TanishElectronics.Api.DTOs.Enquiries;
using TanishElectronics.Api.DTOs.Public.ChatBot;
using TanishElectronics.Api.DTOs.ServiceRequests;

namespace TanishElectronics.Api.Services;

public partial class ChatbotService
{
    /// <summary>
    /// Resolves a product ID from the AI-provided tag values, with fallback to path-based resolution.
    /// </summary>
    private async Task<int?> ResolveProductId(string? tagProductIdStr, string? tagProductName, string? currentPath)
    {
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

        if (!resolvedProductId.HasValue && !string.IsNullOrWhiteSpace(currentPath))
        {
            var segments = currentPath.Trim().Trim('/').Split('/');
            if (segments.Length >= 2 && segments[0].Equals("products", StringComparison.OrdinalIgnoreCase))
            {
                var idPart = segments[1].Split('?')[0].Split('#')[0].Trim();
                if (int.TryParse(idPart, out var pathPid))
                {
                    resolvedProductId = pathPid;
                }
            }
        }

        return resolvedProductId;
    }

    /// <summary>
    /// Builds the subject line for an enquiry based on resolved product info.
    /// </summary>
    private async Task<string> BuildEnquirySubjectAsync(int? resolvedProductId, string? tagProductName)
    {
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
        return subject;
    }

    /// <summary>
    /// Processes a SUBMIT_ENQUIRY tag from the AI reply and submits the enquiry to the database.
    /// Returns submission details for building the summary card.
    /// </summary>
    private async Task<EnquirySubmissionResult> ProcessEnquiryTagAsync(string fullReply, ChatRequestDto request)
    {
        var result = new EnquirySubmissionResult();
        var enquiryMatch = GenericEnquiryTagRegex.Match(fullReply);
        if (!enquiryMatch.Success) return result;

        var dict = ParseTagKeyValues(enquiryMatch.Groups[1].Value);
        dict.TryGetValue("name", out var name);
        dict.TryGetValue("phone", out var phone);
        dict.TryGetValue("message", out var msg);
        dict.TryGetValue("productid", out var tagProductIdStr);
        dict.TryGetValue("product", out var tagProductName);

        var finalMessage = !string.IsNullOrWhiteSpace(msg) && !msg.EndsWith("?") ? msg.Trim() : request.Message.Trim();

        result.Name = name;
        result.Phone = phone;
        result.ProductName = tagProductName;
        result.Message = finalMessage;

        int? resolvedProductId = await ResolveProductId(tagProductIdStr, tagProductName, request.CurrentPath);
        var subject = await BuildEnquirySubjectAsync(resolvedProductId, tagProductName);

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
                result.Submitted = true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to submit enquiry via chatbot.");
            }
        }

        return result;
    }

    /// <summary>
    /// Processes a SUBMIT_BOOKING tag from the AI reply and creates the service request in the database.
    /// Returns submission details for building the summary card.
    /// </summary>
    private async Task<BookingSubmissionResult> ProcessBookingTagAsync(string fullReply)
    {
        var result = new BookingSubmissionResult();
        var bookingMatch = GenericBookingTagRegex.Match(fullReply);
        if (!bookingMatch.Success) return result;

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

        result.Name = name;
        result.Phone = phone;
        result.Device = device;
        result.Issue = issue;
        result.Address = address;
        result.ServiceType = serviceType.Contains("home", StringComparison.OrdinalIgnoreCase) ? "Home Visit" : "Shop Drop-off";

        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(phone) || string.IsNullOrWhiteSpace(device))
            return result;

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

            var sr = await _serviceRequestService.CreateAsync(new CreateServiceRequestDto
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

            result.Submitted = true;
            result.TrackingNumber = sr.RequestNumber;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to create service request via chatbot.");
        }

        return result;
    }

    /// <summary>
    /// Builds the enquiry summary card string for chat display.
    /// </summary>
    private static string BuildEnquirySummaryCard(EnquirySubmissionResult enquiry)
    {
        var pName = !string.IsNullOrWhiteSpace(enquiry.ProductName) ? enquiry.ProductName : "Electronics Enquiry";
        return $"\n\n📋 **Enquiry Summary:**\n• **Product**: {pName}\n• **Customer**: {enquiry.Name}\n• **Phone**: {enquiry.Phone}\n• **Message**: {enquiry.Message ?? "General Enquiry"}\n• **Status**: Received — Our team will contact you shortly.";
    }

    /// <summary>
    /// Builds the booking summary card string for chat display.
    /// </summary>
    private static string BuildBookingSummaryCard(BookingSubmissionResult booking)
    {
        var addrLine = booking.ServiceType == "Home Visit" && !string.IsNullOrWhiteSpace(booking.Address) && booking.Address != "Shop Drop-off"
            ? $" — {booking.Address}" : "";
        return $"\n\n✅ **Repair Request Booked Successfully!**\n\n📋 **Booking Summary:**\n• **Tracking Number**: `{booking.TrackingNumber}`\n• **Customer**: {booking.Name} ({booking.Phone})\n• **Device**: {booking.Device}\n• **Issue**: {booking.Issue ?? "Repairs required"}\n• **Service Type**: {booking.ServiceType}{addrLine}\n• **Status**: Received — Technician assigned shortly.";
    }

    /// <summary>
    /// Builds contextual action buttons for the chat response.
    /// </summary>
    private async Task<List<ChatActionDto>> BuildChatActionsAsync(
        string userMessage, string replyText, bool enquirySubmitted, bool bookingSubmitted,
        List<ChatProductCardDto>? matchedProducts)
    {
        var shopSettings = await _cacheService.GetOrCreateAsync(
            "chatbot:shop-settings",
            () => _settingsRepository.GetSettingsAsync(),
            TimeSpan.FromMinutes(1)
        );

        var shopPhone = !string.IsNullOrWhiteSpace(shopSettings?.PrimaryPhone)
            ? shopSettings.PrimaryPhone
            : "+91 98200 00000";

        var actions = new List<ChatActionDto>();
        var lowerMsg = NormalizeMessage(userMessage);
        var lowerReply = replyText.ToLowerInvariant();

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
            var repairKeywords = new[]
            {
                "repair", "fix", "broken", "issue", "problem", "fault", "not working", "book", "service",
                "technician", "horizontal", "vertical", "line", "lines", "screen", "display", "panel",
                "sound", "power", "flicker", "blink", "dead", "black", "blank", "drop-off", "home visit"
            };
            var isRepairRelated = repairKeywords.Any(k => lowerMsg.Contains(k) || lowerReply.Contains(k));

            var productBuyingKeywords = new[]
            {
                "buy", "purchase", "price", "stock", "cost", "sale", "offer", "discount", "second hand",
                "used", "refurbished", "for sale", "in stock", "catalogue", "catalog", "options"
            };
            var isProductRelated = !isRepairRelated && (productBuyingKeywords.Any(k => lowerMsg.Contains(k) || lowerReply.Contains(k)) || (matchedProducts != null && matchedProducts.Any()));

            var trackKeywords = new[] { "track", "status" };
            var isTrackRelated = trackKeywords.Any(k => lowerMsg.Contains(k) || lowerReply.Contains(k));

            if (isProductRelated)
            {
                actions.Add(new ChatActionDto { Label = "Browse Products", Url = "/products", Icon = "package" });
            }

            if (isTrackRelated || isRepairRelated)
            {
                actions.Add(new ChatActionDto { Label = "Track Repair", Url = "/track-request", Icon = "search" });
            }

            if (lowerMsg.Contains("contact") || lowerMsg.Contains("call") || lowerMsg.Contains("phone") || lowerMsg.Contains("location") || lowerMsg.Contains("address") || isRepairRelated)
            {
                actions.Add(new ChatActionDto { Label = "Call Shop", Url = $"tel:{shopPhone}", Icon = "phone" });
            }
        }

        return actions;
    }

    // --- Internal result DTOs for tag processing ---

    private class EnquirySubmissionResult
    {
        public bool Submitted { get; set; }
        public string? Name { get; set; }
        public string? Phone { get; set; }
        public string? ProductName { get; set; }
        public string? Message { get; set; }
    }

    private class BookingSubmissionResult
    {
        public bool Submitted { get; set; }
        public string? TrackingNumber { get; set; }
        public string? Name { get; set; }
        public string? Phone { get; set; }
        public string? Device { get; set; }
        public string? Issue { get; set; }
        public string? ServiceType { get; set; }
        public string? Address { get; set; }
    }
}

