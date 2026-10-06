import { apiClient } from "./apiClient";

export interface StoreKnowledgeItem {
  storeKnowledgeId: number;
  title: string;
  category: string;
  content: string;
  tags?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface StoreKnowledgeListResponse {
  items: StoreKnowledgeItem[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
  // Backward compatibility aliases
  totalCount?: number;
  page?: number;
}

export interface CreateStoreKnowledgePayload {
  title: string;
  category: string;
  content: string;
  tags?: string | null;
  isActive: boolean;
}

export interface UpdateStoreKnowledgePayload {
  title: string;
  category: string;
  content: string;
  tags?: string | null;
  isActive: boolean;
}

export async function getStoreKnowledgeArticles(
  token: string,
  params: {
    page?: number;
    pageNumber?: number;
    pageSize?: number;
    search?: string;
    category?: string;
    isActive?: boolean;
  }
) {
  const query = new URLSearchParams();
  const pageValue = params.pageNumber ?? params.page ?? 1;
  query.append("pageNumber", String(pageValue));
  query.append("pageSize", String(params.pageSize ?? 15));

  if (params.search?.trim()) {
    query.append("search", params.search.trim());
  }
  if (params.category && params.category !== "All") {
    query.append("category", params.category);
  }
  if (params.isActive !== undefined) {
    query.append("isActive", String(params.isActive));
  }

  const res = await apiClient<StoreKnowledgeListResponse>(
    `/admin/store-knowledge?${query.toString()}`,
    {
      method: "GET",
      authToken: token
    }
  );

  return {
    ...res,
    items: res.items || [],
    totalRecords: res.totalRecords ?? res.totalCount ?? 0,
    totalCount: res.totalRecords ?? res.totalCount ?? 0,
    pageNumber: res.pageNumber ?? res.page ?? pageValue,
    page: res.pageNumber ?? res.page ?? pageValue
  };
}

export async function getStoreKnowledgeCategories(token: string) {
  return await apiClient<string[]>("/admin/store-knowledge/categories", {
    method: "GET",
    authToken: token
  });
}

export async function getStoreKnowledgeById(token: string, id: number) {
  return await apiClient<StoreKnowledgeItem>(`/admin/store-knowledge/${id}`, {
    method: "GET",
    authToken: token
  });
}

export async function createStoreKnowledge(
  token: string,
  payload: CreateStoreKnowledgePayload
) {
  return await apiClient<StoreKnowledgeItem>("/admin/store-knowledge", {
    method: "POST",
    authToken: token,
    body: JSON.stringify(payload)
  });
}

export async function updateStoreKnowledge(
  token: string,
  id: number,
  payload: UpdateStoreKnowledgePayload
) {
  return await apiClient<StoreKnowledgeItem>(`/admin/store-knowledge/${id}`, {
    method: "PUT",
    authToken: token,
    body: JSON.stringify(payload)
  });
}

export async function toggleStoreKnowledgeActive(token: string, id: number) {
  return await apiClient<{ storeKnowledgeId: number; isActive: boolean; message: string }>(
    `/admin/store-knowledge/${id}/toggle-active`,
    {
      method: "PATCH",
      authToken: token
    }
  );
}

export async function deleteStoreKnowledge(token: string, id: number) {
  return await apiClient<{ message: string }>(`/admin/store-knowledge/${id}`, {
    method: "DELETE",
    authToken: token
  });
}

