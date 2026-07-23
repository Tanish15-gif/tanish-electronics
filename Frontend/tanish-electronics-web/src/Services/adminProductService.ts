import { apiClient } from "./apiClient";
import type { LookUpItem } from "./serviceRequestService";
import type { PagedResult } from "./adminServiceRequestService";

export type AdminProductListItem = {
  productId: number;
  productName: string;

  categoryName: string;
  conditionName: string;

  brand?: string;
  modelName?: string;

  price: number;
  stockQuantity: number;

  isAvailable: boolean;
  isFeatured: boolean;

  primaryImageUrl?: string;

  createdAt: string;
};

export type AdminProductFilters = {
  categoryId?: number | null;
  conditionId?: number | null;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
};

export async function getAdminProducts(
  filters: AdminProductFilters,
  token?: string | null
) {
  const queryString = buildProductQuery(filters);

  return await apiClient<PagedResult<AdminProductListItem>>(
    `/admin/products?${queryString}`,
    {
      authToken: token
    }
  );
}

export async function getProductCategories() {
  return await apiClient<LookUpItem[]>("/Lookups/product-categories");
}

export async function getProductConditions() {
  return await apiClient<LookUpItem[]>("/Lookups/product-conditions");
}

export type CreateProduct = {
  productCategoryId: number;
  productConditionId: number;

  productName: string;

  brand?: string;
  modelName?: string;
  description?: string;

  price: number;
  stockQuantity: number;

  isAvailable: boolean;
  isFeatured: boolean;
  createAnnouncement: boolean;
  announcementTitle: string | null;
  announcementMessage: string | null;
  announcementPriority: number;
  announcementEndAt: string | null;
};

export type ProductCreated = {
  productId: number;
  productName: string;
  message: string;
};

export async function createAdminProduct(
  data: CreateProduct,
  token?: string | null
) {
  return await apiClient<ProductCreated>(`/admin/products`, {
    method: "POST",
    authToken: token,
    body: JSON.stringify(data)
  });
}

export type AdminProductDetails = {
  productId: number;

  productCategoryId: number;
  productConditionId: number;

  productName: string;

  brand?: string;
  modelName?: string;
  description?: string;

  price: number;
  stockQuantity: number;

  isAvailable: boolean;
  isFeatured: boolean;

  primaryImageUrl?: string;

  createdAt: string;
  updatedAt?: string;
};

export type UpdateProduct = {
  productCategoryId: number;
  productConditionId: number;

  productName: string;

  brand?: string;
  modelName?: string;
  description?: string;

  price: number;
  stockQuantity: number;

  isAvailable: boolean;
  isFeatured: boolean;

  imageUrl?: string;
};

function buildProductQuery(filters: AdminProductFilters) {
  const params = new URLSearchParams();

  if (filters.categoryId && filters.categoryId > 0) {
    params.append("categoryId", filters.categoryId.toString());
  }

  if (filters.conditionId && filters.conditionId > 0) {
    params.append("conditionId", filters.conditionId.toString());
  }

  if (filters.search?.trim()) {
    params.append("search", filters.search.trim());
  }

  params.append("pageNumber", String(filters.pageNumber ?? 1));
  params.append("pageSize", String(filters.pageSize ?? 10));

  return params.toString();
}

export async function getAdminProductById(
  productId: number,
  token?: string | null
) {
  return await apiClient<AdminProductDetails>(`/admin/products/${productId}`, {
    authToken: token
  });
}

export async function updateAdminProduct(
  productId: number,
  data: UpdateProduct,
  token?: string | null
) {
  return await apiClient<{ message: string }>(`/admin/products/${productId}`, {
    method: "PUT",
    authToken: token,
    body: JSON.stringify(data)
  });
}
export async function deleteAdminProduct(id: number, token?: string | null) {
  return await apiClient<{ message: string }>(`admin/products/${id}`, {
    method: "DELETE",
    authToken: token
  });
}
export type UploadProductImageResponse = {
  message: string;
  imageUrl: string;
};

export async function uploadProductImage(
  productId: number,
  image: File,
  authToken?: string | null
) {
  const formData = new FormData();

  formData.append("image", image);

  return await apiClient<UploadProductImageResponse>(
    `/Products/${productId}/images`,
    {
      method: "POST",
      body: formData,
      authToken
    }
  );
}
