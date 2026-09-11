using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TanishElectronics.Api.Data;
using TanishElectronics.Api.DTOs.Admin.ChatLogs;
using TanishElectronics.Api.DTOs.Common;
using TanishElectronics.Api.Entities;
using TanishElectronics.Api.Interfaces.Services;

namespace TanishElectronics.Api.Services;

public class ChatLogService : IChatLogService
{
    private readonly TanishElectronicsDbContext _db;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ChatLogService> _logger;

    public ChatLogService(
        TanishElectronicsDbContext db,
        IServiceScopeFactory scopeFactory,
        ILogger<ChatLogService> logger)
    {
        _db = db;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task SaveMessageAsync(
        string sessionKey, int? appUserId,
        string userMessage, string botReply,
        string? currentPath,
        bool bookingCreated, bool enquiryCreated,
        string? ipAddress, string? userAgent)
    {
        try
        {
            // Use an isolated DI scope so the background Task.Run has its own DbContext lifetime
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<TanishElectronicsDbContext>();

            var normalizedIp = ipAddress == "::1" ? "127.0.0.1" : ipAddress;
            var safeIp = normalizedIp?.Length > 50 ? normalizedIp[..50] : normalizedIp;
            var safeUserAgent = userAgent?.Length > 500 ? userAgent[..500] : userAgent;

            var session = await db.ChatSessions
                .FirstOrDefaultAsync(s => s.SessionKey == sessionKey);

            if (session == null)
            {
                session = new ChatSession
                {
                    SessionKey = sessionKey,
                    AppUserId = appUserId,
                    IpAddress = safeIp,
                    UserAgent = safeUserAgent,
                    StartedAt = DateTime.Now,
                    LastMessageAt = DateTime.Now,
                    MessageCount = 0
                };
                db.ChatSessions.Add(session);
                await db.SaveChangesAsync();
            }

            session.LastMessageAt = DateTime.Now;
            session.MessageCount += 1;
            if (session.AppUserId == null && appUserId != null)
                session.AppUserId = appUserId;
            if (string.IsNullOrEmpty(session.IpAddress) && !string.IsNullOrEmpty(safeIp))
                session.IpAddress = safeIp;
            if (string.IsNullOrEmpty(session.UserAgent) && !string.IsNullOrEmpty(safeUserAgent))
                session.UserAgent = safeUserAgent;

            db.ChatMessages.Add(new ChatMessage
            {
                ChatSessionId = session.ChatSessionId,
                UserMessage = userMessage,
                BotReply = botReply,
                CurrentPath = currentPath,
                BookingCreated = bookingCreated,
                EnquiryCreated = enquiryCreated,
                CreatedAt = DateTime.Now
            });

            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to save chat log for session {SessionKey}", sessionKey);
        }
    }

    public async Task<PagedResultDto<ChatLogItemDto>> GetLogsAsync(
        int page, int pageSize, string? search, DateTime? from, DateTime? to)
    {
        var query = _db.ChatSessions
            .Include(s => s.AppUser)
            .Include(s => s.Messages)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(x =>
                (x.AppUser != null && x.AppUser.FullName.Contains(s)) ||
                x.Messages.Any(m => m.UserMessage.Contains(s) || m.BotReply.Contains(s)));
        }

        if (from.HasValue) query = query.Where(x => x.StartedAt >= from.Value);
        if (to.HasValue) query = query.Where(x => x.StartedAt <= to.Value);

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(x => x.LastMessageAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new ChatLogItemDto
            {
                ChatSessionId = x.ChatSessionId,
                SessionKey = x.SessionKey,
                UserName = x.AppUser != null ? x.AppUser.FullName : null,
                UserPhone = x.AppUser != null ? x.AppUser.PhoneNumber : null,
                MessageCount = x.MessageCount,
                LastMessageAt = x.LastMessageAt,
                StartedAt = x.StartedAt,
                HasBooking = x.Messages.Any(m => m.BookingCreated),
                HasEnquiry = x.Messages.Any(m => m.EnquiryCreated),
                IpAddress = x.IpAddress
            })
            .ToListAsync();

        return new PagedResultDto<ChatLogItemDto>
        {
            Items = items,
            TotalRecords = total,
            PageNumber = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling((double)total / pageSize)
        };
    }

    public async Task<ChatSessionDetailDto> GetSessionAsync(int sessionId)
    {
        var session = await _db.ChatSessions
            .Include(s => s.AppUser)
            .Include(s => s.Messages)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.ChatSessionId == sessionId)
            ?? throw new InvalidOperationException("Chat session not found.");

        return new ChatSessionDetailDto
        {
            ChatSessionId = session.ChatSessionId,
            UserName = session.AppUser?.FullName,
            UserPhone = session.AppUser?.PhoneNumber,
            StartedAt = session.StartedAt,
            Messages = session.Messages
                .OrderBy(m => m.CreatedAt)
                .Select(m => new ChatMessagePairDto
                {
                    ChatMessageId = m.ChatMessageId,
                    UserMessage = m.UserMessage,
                    BotReply = m.BotReply,
                    CurrentPath = m.CurrentPath,
                    BookingCreated = m.BookingCreated,
                    EnquiryCreated = m.EnquiryCreated,
                    CreatedAt = m.CreatedAt
                }).ToList()
        };
    }

    public async Task<ChatLogStatsDto> GetStatsAsync()
    {
        var today = DateTime.Now.Date;
        return new ChatLogStatsDto
        {
            TotalSessions = await _db.ChatSessions.CountAsync(),
            TotalMessages = await _db.ChatMessages.CountAsync(),
            BookingsTriggered = await _db.ChatMessages.CountAsync(m => m.BookingCreated),
            EnquiriesTriggered = await _db.ChatMessages.CountAsync(m => m.EnquiryCreated),
            SessionsToday = await _db.ChatSessions.CountAsync(s => s.StartedAt >= today)
        };
    }
}

