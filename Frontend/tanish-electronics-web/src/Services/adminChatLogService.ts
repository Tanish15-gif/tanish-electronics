import { apiClient } from "./apiClient";

export type ChatLogItem = {
  chatSessionId: number;
  sessionKey: string;
  userName?: string | null;
  userPhone?: string | null;
  messageCount: number;
  lastMessageAt: string;
  startedAt: string;
  hasBooking: boolean;
  hasEnquiry: boolean;
  ipAddress?: string | null;
};

export type ChatMessagePair = {
  chatMessageId: number;
  userMessage: string;
  botReply: string;
  currentPath?: string | null;
  bookingCreated: boolean;
  enquiryCreated: boolean;
  createdAt: string;
};

export type ChatSessionDetail = {
  chatSessionId: number;
  userName?: string | null;
  userPhone?: string | null;
  startedAt: string;
  messages: ChatMessagePair[];
};

export type ChatLogStats = {
  totalSessions: number;
  totalMessages: number;
  bookingsTriggered: number;
  enquiriesTriggered: number;
  sessionsToday: number;
};

export type PagedResult<T> = {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export async function getAdminChatLogs(
  token: string,
  params: {
    page?: number;
    pageSize?: number;
    search?: string;
    from?: string;
    to?: string;
  }
) {
  const query = new URLSearchParams();
  query.append("page", String(params.page ?? 1));
  query.append("pageSize", String(params.pageSize ?? 15));

  if (params.search?.trim()) {
    query.append("search", params.search.trim());
  }
  if (params.from?.trim()) {
    query.append("from", params.from.trim());
  }
  if (params.to?.trim()) {
    query.append("to", params.to.trim());
  }

  return await apiClient<PagedResult<ChatLogItem>>(
    `/admin/chat-logs?${query.toString()}`,
    {
      method: "GET",
      authToken: token
    }
  );
}

export async function getAdminChatSession(token: string, sessionId: number) {
  return await apiClient<ChatSessionDetail>(`/admin/chat-logs/${sessionId}`, {
    method: "GET",
    authToken: token
  });
}

export async function getAdminChatStats(token: string) {
  return await apiClient<ChatLogStats>(`/admin/chat-logs/stats`, {
    method: "GET",
    authToken: token
  });
}
