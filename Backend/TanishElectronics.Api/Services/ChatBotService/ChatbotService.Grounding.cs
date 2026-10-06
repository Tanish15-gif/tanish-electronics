using System.Text;
using Microsoft.EntityFrameworkCore;
using TanishElectronics.Api.DTOs.Public.Announcements;
using TanishElectronics.Api.DTOs.Public.ChatBot;
using TanishElectronics.Api.DTOs.ServiceRequests;

namespace TanishElectronics.Api.Services;

public partial class ChatbotService
{
    private async Task<(string Context, List<ChatProductCardDto> Products)> BuildGroundingContextAsync(
        string message, string? currentPath = null, int? appUserId = null, List<ChatHistoryItemDto>? history = null)
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
            sb.AppendLine($"- Home visit message / policy: {shopSettings.HomeVisitMessage}");
            sb.AppendLine($"- Hours: {shopSettings.OpeningHours}");
            sb.AppendLine($"- Booking notice: {shopSettings.BookingNotice}");
        }

        // --- Semantic Vector Search across StoreKnowledges (RAG) ---
        try
        {
            var semanticKnowledge = await _knowledgeVectorService.SearchAsync(message, topK: 3);
            if (semanticKnowledge.Any())
            {
                sb.AppendLine("- Verified Store Policies & Technical Knowledge (Semantically Retrieved):");
                foreach (var k in semanticKnowledge)
                {
                    sb.AppendLine($"  * [{k.Category}] {k.Title}:");
                    sb.AppendLine($"    {k.Content}");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to retrieve semantic vector knowledge for message: {Message}", message);
        }

        // --- Authenticated Customer Profile ---
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

        // --- Currently Viewed Product Page ---
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

        // --- Repair Tracking ---
        var lowerMessage = NormalizeMessage(message);

        var normalizedForRegex = message
            .Replace('\u2013', '-')
            .Replace('\u2014', '-')
            .Replace('\u2010', '-');

        var requestNumberMatch = RequestNumberPattern.Match(normalizedForRegex);
        var phoneNumberMatch = PhoneNumberPattern.Match(normalizedForRegex);

        if (!requestNumberMatch.Success && history != null)
        {
            foreach (var h in history.TakeLast(6).Reverse())
            {
                var m = RequestNumberPattern.Match(h.Content);
                if (m.Success) { requestNumberMatch = m; break; }
            }
        }

        if (!phoneNumberMatch.Success && history != null)
        {
            foreach (var h in history.TakeLast(6).Reverse())
            {
                var m = PhoneNumberPattern.Match(h.Content);
                if (m.Success) { phoneNumberMatch = m; break; }
            }
        }

        string? resolvedPhoneNumber = phoneNumberMatch.Success ? phoneNumberMatch.Value : null;
        if (string.IsNullOrWhiteSpace(resolvedPhoneNumber) && appUserId.HasValue)
        {
            var userPhone = await _dbContext.Customers
                .Where(c => c.AppUserId == appUserId.Value && c.DeletedAt == null && c.IsActive)
                .Select(c => c.PhoneNumber)
                .FirstOrDefaultAsync();
            if (!string.IsNullOrWhiteSpace(userPhone))
            {
                resolvedPhoneNumber = userPhone;
            }
        }

        var mentionsTracking = TrackingKeywords.Any(k => lowerMessage.Contains(k)) || requestNumberMatch.Success;

        if (requestNumberMatch.Success && !string.IsNullOrWhiteSpace(resolvedPhoneNumber))
        {
            try
            {
                var tracking = await _serviceRequestService.TrackAsync(new TrackServiceRequestDto
                {
                    RequestNumber = requestNumberMatch.Value.ToUpperInvariant(),
                    PhoneNumber = resolvedPhoneNumber
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

        // --- Product Search / Repair Context Detection ---
        var combinedHistoryText = string.Join(" ", history?.Select(h => h.Content) ?? Enumerable.Empty<string>()).ToLowerInvariant();

        var repairKeywords = new[]
        {
            "repair", "fix", "broken", "issue", "problem", "fault", "not working", "service", "book", "booking",
            "visit", "technician", "warranty", "line", "lines", "horizontal", "vertical", "display",
            "screen", "panel", "flicker", "flickering", "blink", "blinking", "black", "blank", "dead",
            "power", "audio", "sound", "volume", "smoke", "spark", "damaged", "crack", "cracked",
            "patch", "distorted", "led", "backlight", "motherboard", "tcon", "t-con", "board", "sensor",
            "strip", "hanging", "reboot", "restart", "no display", "no power", "no sound", "drop-off",
            "home visit", "shop repair", "santacruz", "address"
        };

        var isRepairInMessage = repairKeywords.Any(k => lowerMessage.Contains(k));
        var isRepairInHistory = repairKeywords.Any(k => combinedHistoryText.Contains(k));
        var isOngoingBookingFlow = combinedHistoryText.Contains("book a repair") ||
                                   combinedHistoryText.Contains("book this repair") ||
                                   combinedHistoryText.Contains("device & brand") ||
                                   combinedHistoryText.Contains("issue description") ||
                                   combinedHistoryText.Contains("service type");

        var isRepairQuery = isRepairInMessage || isRepairInHistory || isOngoingBookingFlow ||
                            (!string.IsNullOrWhiteSpace(currentPath) && currentPath.Trim().Trim('/').Equals("book-repair", StringComparison.OrdinalIgnoreCase));

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

        var buyingIntentKeywords = new[]
        {
            "buy", "purchase", "price", "cost", "how much", "rate", "available", "for sale", "in stock",
            "looking for", "want to buy", "show me", "do you have", "catalogue", "catalog", "options",
            "sell", "selling", "second hand", "used", "refurbished", "model to buy", "recommend",
            "options in stock", "enquire about", "enquiry", "product", "products", "item", "items"
        };
        var hasBuyingIntent = buyingIntentKeywords.Any(k => lowerMessage.Contains(k));
        var currentMessageHasBuyingIntent = hasBuyingIntent && !isRepairInMessage;

        var isProductQuery = !isRepairInMessage
            && !isAskingAboutCurrentProduct
            && !isAnnouncementQuery
            && !isReviewQuery
            && !mentionsTracking
            && (currentMessageHasBuyingIntent || (specificItem != null && (hasBuyingIntent || lowerMessage.StartsWith("show") || lowerMessage.StartsWith("do you"))));

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

            var topMatches = products.Take(5).ToList();
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

