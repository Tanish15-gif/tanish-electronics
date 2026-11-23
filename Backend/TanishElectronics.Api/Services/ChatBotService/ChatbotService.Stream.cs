using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using TanishElectronics.Api.DTOs.Public.ChatBot;

namespace TanishElectronics.Api.Services;

public partial class ChatbotService
{
    public async IAsyncEnumerable<ChatStreamEventDto> StreamReplyAsync(ChatRequestDto request, [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        ValidateChatRequest(request);
        _verifiedTracking = null;
        var appUserId = await _currentUserService.GetCurrentAppUserIdAsync();
        var bookingOwner = GetOwnedSessionKey(request, appUserId);
        var bookingRevision = await _bookingDrafts.BeginMessageAsync(bookingOwner);
        var ipAddress = _authContextAccessor.GetClientIpAddress();
        var userAgent = _authContextAccessor.GetUserAgent();

        var (groundingContext, matchedProducts) = await BuildGroundingContextAsync(request.Message, request.CurrentPath,
            request.IncludeAccountContext ? appUserId : null, request.History);
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
            _logger.LogError("Groq streaming failed: {Status}", response.StatusCode);
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

        // --- Stream tokens from LLM, suppressing [SUBMIT_*] tags ---
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

        // --- Flush remaining buffer ---
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

        // --- Post-stream: Process tags and emit summary cards ---
        var fullReply = fullReplyBuilder.ToString();
        var bookingDraft = await PrepareBookingAsync(fullReply, bookingOwner, bookingRevision);
        if (GenericBookingTagRegex.IsMatch(fullReply) && bookingDraft == null)
            yield return new ChatStreamEventDto { Type = "token", Content = "\n\nI couldn't prepare that summary. Please check your name, phone, device, issue and service area, and ask me for an updated booking summary." };

        var enquiry = await ProcessEnquiryTagAsync(fullReply, request);
        var booking = await ProcessBookingTagAsync(fullReply);

        var visibleText = streamedVisibleTextBuilder.ToString().Trim();
        List<ChatProductCardDto>? enquiryCompanionProducts = null;

        if (enquiry.Submitted)
        {
            var summaryCard = BuildEnquirySummaryCard(enquiry);

            if (string.IsNullOrWhiteSpace(visibleText))
            {
                yield return new ChatStreamEventDto
                {
                    Type = "token",
                    Content = $"**Enquiry Submitted Successfully!**{summaryCard}"
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

            var companionProducts = await GetCompanionProductsForEnquiryAsync(enquiry.ProductId, enquiry.ProductName);
            if (companionProducts.Any())
            {
                enquiryCompanionProducts = companionProducts;
                yield return new ChatStreamEventDto
                {
                    Type = "token",
                    Content = "\n\n**Related products to explore:**\nThese items are currently in stock. For remotes and accessories, ask the shop to confirm your exact model."
                };
            }
        }
        else if (booking.Submitted)
        {
            var bookingCard = BuildBookingSummaryCard(booking);

            if (string.IsNullOrWhiteSpace(visibleText) || !visibleText.Contains("Booking Summary", StringComparison.OrdinalIgnoreCase))
            {
                yield return new ChatStreamEventDto
                {
                    Type = "token",
                    Content = bookingCard
                };
            }
            else if (!visibleText.Contains(booking.TrackingNumber ?? ""))
            {
                yield return new ChatStreamEventDto
                {
                    Type = "token",
                    Content = $"\n\n**Official Tracking Number**: `{booking.TrackingNumber}`"
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

        // --- Emit metadata (products + action buttons) ---
        var actions = await BuildChatActionsAsync(request.Message, fullReply, enquiry.Submitted, booking.Submitted, matchedProducts);
        if (bookingDraft != null) actions.RemoveAll(a => a.Url == "chat:book-repair");

        List<ChatProductCardDto>? finalProducts = null;
        if (enquiry.Submitted)
        {
            finalProducts = enquiryCompanionProducts;
        }
        else if (!booking.Submitted && matchedProducts?.Any() == true)
        {
            finalProducts = matchedProducts;
        }

        yield return new ChatStreamEventDto
        {
            Type = "metadata",
            BookingDraft = bookingDraft,
            Tracking = _verifiedTracking,
            Products = finalProducts,
            Actions = actions.Any() ? actions.DistinctBy(a => a.Label).ToList() : null
        };

        // --- Save conversation to DB (fire-and-forget, never blocks streaming) ---
        var sessionKey = GetOwnedSessionKey(request, appUserId);

            await _chatLogService.SaveMessageAsync(
                sessionKey: sessionKey,
                appUserId: appUserId,
                userMessage: request.Message,
                botReply: visibleText,
                currentPath: request.CurrentPath,
                bookingCreated: booking.Submitted,
                enquiryCreated: enquiry.Submitted,
                ipAddress: ipAddress,
                userAgent: userAgent
            );

        yield return new ChatStreamEventDto { Type = "done" };
    }
}

