const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export type HealthStatus = "Healthy" | "Degraded" | "Unhealthy";

export type HealthCheckItem = {
  name: string;
  status: HealthStatus;
  durationMs: number;
  description?: string | null;
  data?: Record<string, unknown>;
};

export type HealthReport = {
  status: HealthStatus;
  totalDurationMs: number;
  checks: HealthCheckItem[];
};

export async function getHealthDetails(token?: string | null) {
  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}/health/details`, {
    method: "GET",
    headers
  });

  const text = await response.text();

  if (!text) {
    throw new Error("Health check returned empty response.");
  }

  const data = JSON.parse(text) as HealthReport;

  return data;
}
