using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TanishElectronics.Api.Constants;
using TanishElectronics.Api.DTOs.Public.ChatBot;
using TanishElectronics.Api.Exceptions;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Controllers;

[ApiController]
[Route("public/chat")]
[EnableRateLimiting(RateLimitPolicies.ChatMessage)]
public class ChatbotController : ControllerBase
{
    private readonly IChatbotService _chatbotService;
    public ChatbotController(IChatbotService chatbotService)
    {
        _chatbotService = chatbotService;
    }

    [HttpPost]
    public async Task<ActionResult<ChatResponseDto>> Chat([FromBody] ChatRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Message)) return BadRequest(new { message = "Message cannot be empty" });

        if (request.Message.Length > 500) return BadRequest(new { message = "Message is too long." });

        var reply = await _chatbotService.GetReplyAsync(request);
        return Ok(reply);
    }

    [HttpPost("stream")]
    public async Task StreamChat([FromBody] ChatRequestDto request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            Response.StatusCode = 400;
            await Response.WriteAsync("Message cannot be empty", cancellationToken);
            return;
        }

        if (request.Message.Length > 500)
        {
            Response.StatusCode = 400;
            await Response.WriteAsync("Message is too long.", cancellationToken);
            return;
        }

        Response.Headers.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";

        var jsonOptions = new System.Text.Json.JsonSerializerOptions
        {
            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
        };

        await foreach (var evt in _chatbotService.StreamReplyAsync(request, cancellationToken))
        {
            var json = System.Text.Json.JsonSerializer.Serialize(evt, jsonOptions);
            await Response.WriteAsync($"data: {json}\n\n", cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);
        }
    }
}