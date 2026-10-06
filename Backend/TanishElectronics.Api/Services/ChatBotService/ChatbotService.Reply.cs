using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using TanishElectronics.Api.DTOs.Public.ChatBot;

namespace TanishElectronics.Api.Services;

public partial class ChatbotService
{
    public async Task<ChatResponseDto> GetReplyAsync(ChatRequestDto request)
    {
        var appUserId = await _currentUserService.GetCurrentAppUserIdAsync();
        var ipAddress = _authContextAccessor.GetClientIpAddress();
        var userAgent = _authContextAccessor.GetUserAgent();

        var (groundingContext, matchedProducts) = await BuildGroundingContextAsync(request.Message, request.CurrentPath, appUserId, request.History);
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

        // --- Process Enquiry Tag ---
        var enquiry = await ProcessEnquiryTagAsync(reply, request);
        reply = GenericEnquiryTagRegex.Replace(reply, "").Trim().Trim('`', '\'', '"', '\n', '\r', ' ');
        List<ChatProductCardDto>? enquiryCompanionProducts = null;
        if (enquiry.Submitted)
        {
            if (!reply.Contains("Enquiry Summary", StringComparison.OrdinalIgnoreCase))
            {
                reply += BuildEnquirySummaryCard(enquiry);
            }

            var (companionProducts, isBrandMatched) = await GetCompanionProductsForEnquiryAsync(enquiry.ProductId, enquiry.ProductName);
            if (companionProducts.Any())
            {
                enquiryCompanionProducts = companionProducts;
                if (isBrandMatched)
                {
                    var pLabel = !string.IsNullOrWhiteSpace(enquiry.ProductName) ? $" for **{enquiry.ProductName}**" : "";
                    reply += $"\n\n**Matching Accessories & Companion Items:**\nWe also have these compatible accessories in stock{pLabel}:";
                }
                else
                {
                    reply += "\n\n**Featured Promotions & Popular Workshop Deals:**\nWhile our team reviews your enquiry, check out these trending items currently in stock:";
                }
            }
        }

        // --- Process Booking Tag ---
        var booking = await ProcessBookingTagAsync(reply);
        reply = GenericBookingTagRegex.Replace(reply, "").Trim().Trim('`', '\'', '"', '\n', '\r', ' ');
        if (booking.Submitted && !reply.Contains("Booking Summary", StringComparison.OrdinalIgnoreCase))
        {
            reply += BuildBookingSummaryCard(booking);
        }

        // --- Build Actions ---
        var actions = await BuildChatActionsAsync(request.Message, reply, enquiry.Submitted, booking.Submitted, matchedProducts);

        // --- Save conversation to DB (fire-and-forget, never blocks chat reply) ---
        var sessionKey = string.IsNullOrWhiteSpace(request.SessionKey)
            ? $"anon-{Guid.NewGuid():N}"
            : request.SessionKey;

        _ = Task.Run(async () =>
        {
            await _chatLogService.SaveMessageAsync(
                sessionKey: sessionKey,
                appUserId: appUserId,
                userMessage: request.Message,
                botReply: reply,
                currentPath: request.CurrentPath,
                bookingCreated: booking.Submitted,
                enquiryCreated: enquiry.Submitted,
                ipAddress: ipAddress,
                userAgent: userAgent
            );
        });

        List<ChatProductCardDto>? finalProducts = null;
        if (enquiry.Submitted)
        {
            finalProducts = enquiryCompanionProducts;
        }
        else if (!booking.Submitted && matchedProducts?.Any() == true)
        {
            finalProducts = matchedProducts;
        }

        return new ChatResponseDto
        {
            Reply = reply,
            Products = finalProducts,
            Actions = actions.Any() ? actions.DistinctBy(a => a.Label).ToList() : null
        };
    }
}
