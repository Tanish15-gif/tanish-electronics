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
        result.ProductId = resolvedProductId;
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
        return $"\n\n**Enquiry Summary:**\n• **Product**: {pName}\n• **Customer**: {enquiry.Name}\n• **Phone**: {enquiry.Phone}\n• **Message**: {enquiry.Message ?? "General Enquiry"}\n• **Status**: Received — Our team will contact you shortly.";
    }

    /// <summary>
    /// Builds the booking summary card string for chat display.
    /// </summary>
    private static string BuildBookingSummaryCard(BookingSubmissionResult booking)
    {
        var addrLine = booking.ServiceType == "Home Visit" && !string.IsNullOrWhiteSpace(booking.Address) && booking.Address != "Shop Drop-off"
            ? $" — {booking.Address}" : "";
        return $"\n\n**Repair Request Booked Successfully!**\n\n**Booking Summary:**\n• **Tracking Number**: `{booking.TrackingNumber}`\n• **Customer**: {booking.Name} ({booking.Phone})\n• **Device**: {booking.Device}\n• **Issue**: {booking.Issue ?? "Repairs required"}\n• **Service Type**: {booking.ServiceType}{addrLine}\n• **Status**: Received — Technician assigned shortly.";
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
                    actions.Add(new ChatActionDto { Label = "Book Repair", Url = "/book-repair", Icon = "wrench" });
                }

                if (lowerMsg.Contains("contact") || lowerMsg.Contains("call") || lowerMsg.Contains("phone") || lowerMsg.Contains("location") || lowerMsg.Contains("address"))
                {
                    actions.Add(new ChatActionDto { Label = "Call Shop", Url = $"tel:{shopPhone}", Icon = "phone" });
                }
            }
        }

        return actions;
    }

    /// <summary>
    /// Finds compatible accessories (such as remotes, adapters, cables) or matching items
    /// for a product that was just enquired about in chat.
    /// If no brand-specific accessories exist (e.g. Vu TV), returns promotional / featured
    /// workshop items so the customer always receives helpful product cards!
    /// </summary>
    private async Task<(List<ChatProductCardDto> Products, bool IsBrandMatched)> GetCompanionProductsForEnquiryAsync(int? productId, string? productName)
    {
        var companionCards = new List<ChatProductCardDto>();
        bool isBrandMatched = false;
        try
        {
            var allProducts = await _productService.GetProductsAsync(null, null, null, false);
            if (!allProducts.Any()) return (companionCards, false);

            string targetBrand = "";
            string targetCategory = "";
            string targetName = productName ?? "";

            if (productId.HasValue)
            {
                try
                {
                    var details = await _productService.GetProductByIdAsync(productId.Value);
                    if (details != null)
                    {
                        targetBrand = (details.Brand ?? "").Trim().ToLowerInvariant();
                        targetCategory = (details.CategoryName ?? "").Trim().ToLowerInvariant();
                        targetName = details.ProductName;
                    }
                }
                catch { }
            }

            var knownBrands = new[] { "vu", "lg", "samsung", "sony", "sansui", "kodak", "croma", "mi", "xiaomi", "oneplus", "tcl", "panasonic", "philips", "nxt" };
            if (string.IsNullOrWhiteSpace(targetBrand))
            {
                var lowerName = targetName.ToLowerInvariant();
                targetBrand = knownBrands.FirstOrDefault(b => lowerName.Contains(b)) ?? "";
            }

            var lowerTargetName = targetName.ToLowerInvariant();
            var isTargetTv = targetCategory.Contains("tv") || targetCategory.Contains("television") ||
                             lowerTargetName.Contains("tv") || lowerTargetName.Contains("television") ||
                             lowerTargetName.Contains("led") || lowerTargetName.Contains("oled") ||
                             lowerTargetName.Contains("smart tv");

            var candidates = allProducts.Where(p => !productId.HasValue || p.ProductId != productId.Value).ToList();

            foreach (var candidate in candidates)
            {
                var candName = candidate.ProductName.ToLowerInvariant();
                var candCategory = (candidate.CategoryName ?? "").ToLowerInvariant();
                var candBrand = (candidate.Brand ?? "").Trim().ToLowerInvariant();

                if (string.IsNullOrWhiteSpace(candBrand))
                {
                    candBrand = knownBrands.FirstOrDefault(b => candName.Contains(b)) ?? "";
                }

                var isRemote = candCategory.Contains("remote") || candName.Contains("remote");
                var isAccessory = candCategory.Contains("accessory") || candCategory.Contains("accessories") ||
                                  candCategory.Contains("adapter") || candCategory.Contains("cable") ||
                                  candName.Contains("adapter") || candName.Contains("cable");
                var isUniversal = candName.Contains("universal") || candCategory.Contains("universal");

                var brandMatches = !string.IsNullOrWhiteSpace(targetBrand) &&
                    (candBrand == targetBrand || candName.Contains(targetBrand));

                var hasConflictingBrand = !string.IsNullOrWhiteSpace(targetBrand) &&
                    !string.IsNullOrWhiteSpace(candBrand) &&
                    targetBrand != candBrand &&
                    !brandMatches &&
                    !isUniversal;

                // Strict brand isolation: If candidate belongs to a conflicting brand (e.g. LG remote for Vu TV), reject it!
                if (hasConflictingBrand) continue;

                // If target is a TV: prioritize matching remotes or universal remotes, then accessories
                if (isTargetTv && isRemote)
                {
                    if (brandMatches || isUniversal)
                    {
                        companionCards.Add(new ChatProductCardDto
                        {
                            ProductId = candidate.ProductId,
                            ProductName = candidate.ProductName,
                            CategoryName = candidate.CategoryName!,
                            ConditionName = candidate.ConditionName,
                            Price = candidate.Price,
                            IsAvailable = candidate.IsAvailable,
                            PrimaryImageUrl = candidate.PrimaryImageUrl
                        });
                        isBrandMatched = true;
                    }
                }
                else if (isTargetTv && isAccessory)
                {
                    if (brandMatches || isUniversal)
                    {
                        companionCards.Add(new ChatProductCardDto
                        {
                            ProductId = candidate.ProductId,
                            ProductName = candidate.ProductName,
                            CategoryName = candidate.CategoryName!,
                            ConditionName = candidate.ConditionName,
                            Price = candidate.Price,
                            IsAvailable = candidate.IsAvailable,
                            PrimaryImageUrl = candidate.PrimaryImageUrl
                        });
                        isBrandMatched = true;
                    }
                }
                else if (brandMatches && candidate.IsAvailable)
                {
                    companionCards.Add(new ChatProductCardDto
                    {
                        ProductId = candidate.ProductId,
                        ProductName = candidate.ProductName,
                        CategoryName = candidate.CategoryName!,
                        ConditionName = candidate.ConditionName,
                        Price = candidate.Price,
                        IsAvailable = candidate.IsAvailable,
                        PrimaryImageUrl = candidate.PrimaryImageUrl
                    });
                    isBrandMatched = true;
                }

                if (companionCards.Count >= 3) break;
            }

            // Fallback: If no matching brand accessories exist (e.g. Vu TV), show workshop featured & popular promotion items!
            if (!companionCards.Any())
            {
                var promoProducts = candidates
                    .Where(c => c.IsAvailable)
                    .OrderByDescending(c => c.IsFeatured)
                    .ThenByDescending(c => c.StockQuantity > 0)
                    .ThenBy(c => c.Price)
                    .Take(3)
                    .ToList();

                foreach (var promo in promoProducts)
                {
                    companionCards.Add(new ChatProductCardDto
                    {
                        ProductId = promo.ProductId,
                        ProductName = promo.ProductName,
                        CategoryName = promo.CategoryName,
                        ConditionName = promo.ConditionName,
                        Price = promo.Price,
                        IsAvailable = promo.IsAvailable,
                        PrimaryImageUrl = promo.PrimaryImageUrl
                    });
                }
                isBrandMatched = false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to retrieve companion products for chatbot enquiry.");
        }

        return (companionCards.Take(3).ToList(), isBrandMatched);
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

