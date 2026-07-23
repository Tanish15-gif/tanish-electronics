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
export async function createEnquiry(data: CreateEnquiry) {
  return await apiClient<EnquiryCreated>("/Enquiries", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
