const BASE_URL = import.meta.env.VITE_API_BASE_URL;

type ApiClientOptions = RequestInit & {
  authToken?: string | null;
};

export async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const fixedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const { authToken, headers: optionHeaders, ...fetchOptions } = options;

  const headers = new Headers(optionHeaders);

  const isFormData = fetchOptions.body instanceof FormData;

  if (fetchOptions.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(`${BASE_URL}${fixedEndpoint}`, {
    ...fetchOptions,
    headers
  });

  const contentType = response.headers.get("content-type") || "";
  const responseText = await response.text();

  let data: any = null;

  if (responseText && contentType.includes("application/json")) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Too many requests. Please wait a minute and try again.");
    }
    const validationErrors =
      data?.errors && typeof data.errors === "object"
        ? Object.values(data.errors).flat().join(" ")
        : "";

    const errorMessage =
      data?.message ||
      data?.title ||
      data?.detail ||
      validationErrors ||
      responseText ||
      `Request failed with status ${response.status}`;

    throw new Error(errorMessage);
  }

  if (!responseText) {
    return null as T;
  }

  if (data) {
    return data as T;
  }

  return responseText as T;
}
