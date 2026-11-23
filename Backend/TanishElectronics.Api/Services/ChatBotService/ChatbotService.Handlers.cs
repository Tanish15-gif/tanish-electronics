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
    // Legacy automatic submission tags do not write. Repair drafts are prepared in
    // ChatbotService.Booking.cs and submitted only by the UI confirmation endpoint.
    private Task<EnquirySubmissionResult> ProcessEnquiryTagAsync(string fullReply, ChatRequestDto request)
        => Task.FromResult(new EnquirySubmissionResult());

    private Task<BookingSubmissionResult> ProcessBookingTagAsync(string fullReply)
        => Task.FromResult(new BookingSubmissionResult());

    /// <summary>
    /// Builds the enquiry summary card string for chat display.
    /// </summary>
    private static string BuildEnquirySummaryCard(EnquirySubmissionResult enquiry)
    {
        var pName = !string.IsNullOrWhiteSpace(enquiry.ProductName) ? enquiry.ProductName : "Electronics Enquiry";
        return $"\n\n**Enquiry Summary:**\nâ€¢ **Product**: {pName}\nâ€¢ **Customer**: {enquiry.Name}\nâ€¢ **Phone**: {enquiry.Phone}\nâ€¢ **Message**: {enquiry.Message ?? "General Enquiry"}\nâ€¢ **Status**: Received â€” Our team will contact you shortly.";
    }

    /// <summary>
    /// Builds the booking summary card string for chat display.
    /// </summary>
    private static string BuildBookingSummaryCard(BookingSubmissionResult booking)
    {
        var addrLine = booking.ServiceType == "Home Visit" && !string.IsNullOrWhiteSpace(booking.Address) && booking.Address != "Shop Drop-off"
            ? $" â€” {booking.Address}" : "";
        return $"\n\n**Repair Request Booked Successfully!**\n\n**Booking Summary:**\nâ€¢ **Tracking Number**: `{booking.TrackingNumber}`\nâ€¢ **Customer**: {booking.Name} ({booking.Phone})\nâ€¢ **Device**: {booking.Device}\nâ€¢ **Issue**: {booking.Issue ?? "Repairs required"}\nâ€¢ **Service Type**: {booking.ServiceType}{addrLine}\nâ€¢ **Status**: Received â€” Technician assigned shortly.";
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

        var shopPhone = NormalizeContactNumber(shopSettings?.PrimaryPhone);
        var whatsappPhone = NormalizeContactNumber(shopSettings?.WhatsAppNumber);

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

            var trackKeywords = new[] { "track", "status", "where is", "where's", "pending", "technician" };
            var isTrackRelated = RequestNumberPattern.IsMatch(replyText)
                || RequestNumberPattern.IsMatch(userMessage)
                || (trackKeywords.Any(k => lowerMsg.Contains(k)) && (PhoneNumberPattern.IsMatch(userMessage) || RequestNumberPattern.IsMatch(userMessage) || lowerReply.Contains("repair #") || lowerReply.Contains("te-")));

            if (isTrackRelated)
            {
                actions.Add(new ChatActionDto { Label = "Track Repair", Url = "/track-request", Icon = "search" });
                actions.Add(new ChatActionDto { Label = "Call Shop", Url = $"tel:{shopPhone}", Icon = "phone" });
            }
            else
            {
                if (isProductRelated)
                {
                    actions.Add(new ChatActionDto { Label = "Browse Products", Url = "/products", Icon = "package" });
                }

                if (isRepairRelated)
                {
                    actions.Add(new ChatActionDto { Label = "Book Repair in Chat", Url = "chat:book-repair", Icon = "wrench" });
                }

                if (lowerMsg.Contains("contact") || lowerMsg.Contains("call") || lowerMsg.Contains("phone") || lowerMsg.Contains("location") || lowerMsg.Contains("address"))
                {
                    actions.Add(new ChatActionDto { Label = "Call Shop", Url = $"tel:{shopPhone}", Icon = "phone" });
                }
            }
        }

        if (new[] { "contact", "call", "phone", "number", "owner", "whatsapp" }.Any(lowerMsg.Contains))
        {
            actions.RemoveAll(a => a.Url.StartsWith("tel:"));
            if (shopPhone != null)
                actions.Add(new ChatActionDto { Label = $"Call {shopSettings!.PrimaryPhone}", Url = $"tel:+{shopPhone}", Icon = "phone" });
            if (whatsappPhone != null)
                actions.Add(new ChatActionDto { Label = "WhatsApp", Url = $"https://wa.me/{whatsappPhone}", Icon = "message" });
        }
        // Never advertise a made-up fallback number or an empty dial link.
        return actions.Where(a => !a.Url.StartsWith("tel:") || shopPhone != null)
            .Select(a => { if (a.Url.StartsWith("tel:")) a.Url = $"tel:+{shopPhone}"; return a; })
            .DistinctBy(a => a.Url).OrderByDescending(a => a.Label.StartsWith("Call ") && a.Label != "Call Shop").ToList();
    }

    private static string? NormalizeContactNumber(string? value)
    {
        var digits = new string((value ?? "").Where(char.IsAsciiDigit).ToArray());
        if (digits.Length == 10) digits = "91" + digits;
        return digits.Length is >= 11 and <= 15 ? digits : null;
    }

    // Use the same ranked, in-stock recommendations as the product details page.
    private async Task<List<ChatProductCardDto>> GetCompanionProductsForEnquiryAsync(int? productId, string? productName)
    {
        try
        {
            if (!productId.HasValue && !string.IsNullOrWhiteSpace(productName))
            {
                var products = await _productService.GetProductsAsync(null, null, productName, false);
                var exactMatches = products.Where(p => string.Equals(p.ProductName.Trim(), productName.Trim(), StringComparison.OrdinalIgnoreCase)).ToList();
                if (exactMatches.Count == 1) productId = exactMatches[0].ProductId;
            }
            if (!productId.HasValue) return [];
            var recommendations = await _productService.GetRecommendationsAsync(productId.Value, 3);
            return recommendations.Select(p => new ChatProductCardDto
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName,
                CategoryName = p.CategoryName,
                ConditionName = p.ConditionName,
                Price = p.Price,
                IsAvailable = p.IsAvailable,
                PrimaryImageUrl = p.PrimaryImageUrl
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to retrieve related products for chatbot enquiry.");
            return [];
        }
    }

    // --- Internal result DTOs for tag processing ---

    private class EnquirySubmissionResult
    {
        public bool Submitted { get; set; }
        public string? Name { get; set; }
        public string? Phone { get; set; }
        public string? ProductName { get; set; }
        public string? Message { get; set; }
        public int? ProductId { get; set; }
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

