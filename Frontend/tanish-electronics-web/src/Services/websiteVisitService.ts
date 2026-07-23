import { apiClient } from "./apiClient";

function getVisitorId() {
  const key = "te_visitor_id";
  const existing = localStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const newId = crypto.randomUUID();

  localStorage.setItem(key, newId);

  return newId;
}

export async function trackWebsiteVisit(path: string) {
  return await apiClient<void>("/public/website-visits", {
    method: "POST",
    body: JSON.stringify({
      visitorId: getVisitorId(),
      path,
      referrer: document.referrer || null
    })
  });
}
