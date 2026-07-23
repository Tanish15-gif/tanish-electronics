import { apiClient } from "./apiClient";

export type AdminAuditLog = {
  auditLogId: number;

  appUserId?: number | null;
  adminName?: string | null;
  adminEmail?: string | null;

  action: string;
  entityName: string;
  entityId?: number | null;

  description?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;

  createdAt: string;
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

export async function getAdminAuditLogs(
  token: string,
  params: {
    search?: string;
    action?: string;
    entityName?: string;
    pageNumber?: number;
    pageSize?: number;
  }
) {
  const query = new URLSearchParams();

  if (params.search?.trim()) {
    query.append("search", params.search.trim());
  }

  if (params.action?.trim()) {
    query.append("action", params.action.trim());
  }

  if (params.entityName?.trim()) {
    query.append("entityName", params.entityName.trim());
  }

  query.append("pageNumber", String(params.pageNumber ?? 1));
  query.append("pageSize", String(params.pageSize ?? 10));

  return await apiClient<PagedResult<AdminAuditLog>>(
    `/admin/audit-logs?${query.toString()}`,
    {
      authToken: token
    }
  );
}
