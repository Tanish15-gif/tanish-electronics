using System;
using System.Collections.Generic;

namespace TanishElectronics.Api.DTOs.Admin.ChatLogs;

public class ChatLogItemDto
{
    public int      ChatSessionId { get; set; }
    public string   SessionKey    { get; set; } = "";
    public string?  UserName      { get; set; }
    public string?  UserPhone     { get; set; }
    public int      MessageCount  { get; set; }
    public DateTime LastMessageAt { get; set; }
    public DateTime StartedAt     { get; set; }
    public bool     HasBooking    { get; set; }
    public bool     HasEnquiry    { get; set; }
    public string?  IpAddress     { get; set; }
}

public class ChatSessionDetailDto
{
    public int                      ChatSessionId { get; set; }
    public string?                  UserName      { get; set; }
    public string?                  UserPhone     { get; set; }
    public DateTime                 StartedAt     { get; set; }
    public List<ChatMessagePairDto> Messages      { get; set; } = [];
}

public class ChatMessagePairDto
{
    public int      ChatMessageId  { get; set; }
    public string   UserMessage    { get; set; } = "";
    public string   BotReply       { get; set; } = "";
    public string?  CurrentPath    { get; set; }
    public bool     BookingCreated { get; set; }
    public bool     EnquiryCreated { get; set; }
    public DateTime CreatedAt      { get; set; }
}

public class ChatLogStatsDto
{
    public int TotalSessions      { get; set; }
    public int TotalMessages      { get; set; }
    public int BookingsTriggered  { get; set; }
    public int EnquiriesTriggered { get; set; }
    public int SessionsToday      { get; set; }
}
