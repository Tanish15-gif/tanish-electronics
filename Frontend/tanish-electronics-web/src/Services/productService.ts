import { apiClient } from "./apiClient";
export type ProductListItem = {
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
};

export type ProductRecommendation = ProductListItem & {
  recommendationKind: "alternative" | "accessory" | "device";
  recommendationReason: string;
};

export type ProductDetails = {
  productId: number;
  productName: string;
  categoryName: string;
  conditionName: string;
  brand?: string;
  modelName?: string;
  description?: string;
  price: number;
  stockQuantity: number;
  isAvailable: boolean;
  isFeatured: boolean;
  imageUrls: string[];
};

export type CreateEnquiry = {
  productId?: number;
  serviceRequestId?: number;
  fullName: string;
  phoneNumber: string;
  email?: string;
  subject?: string;
  message: string;
};

export type EnquiryCreated = {
  enquiryId: number;
  status: string;
  message: string;
};

export async function getProducts() {
  return await apiClient<ProductListItem[]>("/Products");
}
export async function getProductById(productId: number) {
  return await apiClient<ProductDetails>(`/Products/${productId}`);
}
export async function getProductRecommendations(productId: number) {
  return await apiClient<ProductRecommendation[]>(
    `/Products/${productId}/recommendations`
  );
}

const pendingEnquiries = new Map<string, string>();
export async function createEnquiry(data: CreateEnquiry) {
  const signature = JSON.stringify(data);
  const key = pendingEnquiries.get(signature) ?? crypto.randomUUID();
  pendingEnquiries.set(signature, key);
  const response = await apiClient<EnquiryCreated>("/Enquiries", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Idempotency-Key": key }
  });
  pendingEnquiries.delete(signature);
  return response;
}
