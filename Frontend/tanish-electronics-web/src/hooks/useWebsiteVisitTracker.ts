import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackWebsiteVisit } from "../Services/websiteVisitService";

export function useWebsiteVisitTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;

    void trackWebsiteVisit(path).catch(() => {
      // Analytics should never break the website.
    });
  }, [location.pathname, location.search]);
}
