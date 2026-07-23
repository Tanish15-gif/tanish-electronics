import { apiClient } from "./apiClient";

export type PublicRepairFeedback = {
  customerRepairFeedbackId: number;
  customerName: string;
  serviceCategory: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export async function getPublicRepairFeedbacks(limit = 6) {
  return await apiClient<PublicRepairFeedback[]>(
    `/public/feedbacks?limit=${limit}`
  );
}
