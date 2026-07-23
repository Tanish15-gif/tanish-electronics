const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

type ExportParams = Record<
  string,
  string | number | boolean | null | undefined
>;

function buildQuery(params: ExportParams) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      return;
    }

    query.append(key, String(value));
  });

  return query.toString();
}

function getFileNameFromResponse(response: Response, fallback: string) {
  const contentDisposition = response.headers.get("content-disposition");

  if (!contentDisposition) {
    return fallback;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const normalMatch = contentDisposition.match(/filename="?([^"]+)"?/i);

  return normalMatch?.[1] || fallback;
}

async function downloadCsv(
  endpoint: string,
  token: string,
  params: ExportParams,
  fallbackFileName: string
) {
  const query = buildQuery(params);
  const url = `${BASE_URL}${endpoint}${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const text = await response.text();
    let message = `Export failed with status ${response.status}`;

    try {
      const data = JSON.parse(text);
      message = data?.message || data?.title || data?.detail || message;
    } catch {
      if (text) {
        message = text;
      }
    }

    throw new Error(message);
  }

  const blob = await response.blob();

  if (blob.size === 0) {
    throw new Error("Export returned no data. Please try again.");
  }

  const fileName = getFileNameFromResponse(response, fallbackFileName);
  const downloadUrl = window.URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = fileName;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.URL.revokeObjectURL(downloadUrl);
}

export async function exportAuditLogs(
  token: string,
  params: {
    search?: string;
    action?: string;
    entityName?: string;
  }
) {
  return await downloadCsv(
    "/admin/exports/audit-logs",
    token,
    params,
    "audit-logs.csv"
  );
}

export async function exportServiceRequests(
  token: string,
  params: {
    search?: string;
    statusId?: number | null;
  }
) {
  return await downloadCsv(
    "/admin/exports/service-requests",
    token,
    params,
    "service-requests.csv"
  );
}

export async function exportEnquiries(
  token: string,
  params: {
    search?: string;
    statusId?: number | null;
  }
) {
  return await downloadCsv(
    "/admin/exports/enquiries",
    token,
    params,
    "enquiries.csv"
  );
}

export async function exportProducts(
  token: string,
  params: {
    search?: string;
    categoryId?: number | null;
    isAvailable?: boolean | null;
  }
) {
  return await downloadCsv(
    "/admin/exports/products",
    token,
    params,
    "products.csv"
  );
}

export async function exportWebsiteVisits(token: string) {
  return await downloadCsv(
    "/admin/exports/website-visits",
    token,
    {},
    "website-visits.csv"
  );
}

export async function exportFeedbacks(
  token: string,
  params: {
    search?: string;
    isPublic?: boolean | null;
    rating?: number | null;
  }
) {
  return await downloadCsv(
    "/admin/exports/feedbacks",
    token,
    params,
    "feedbacks.csv"
  );
}

export async function exportAnnouncements(
  token: string,
  params: {
    search?: string;
    announcementType?: string;
    audience?: string;
    displayLocation?: string;
    isActive?: boolean | null;
  }
) {
  return await downloadCsv(
    "/admin/exports/announcements",
    token,
    params,
    "announcements.csv"
  );
}
