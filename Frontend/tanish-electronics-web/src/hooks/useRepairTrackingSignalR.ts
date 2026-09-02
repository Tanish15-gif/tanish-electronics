import { useEffect, useState } from "react";
import { subscribeToRepairTracking } from "../Services/repairTrackingRealtimeService";
import type { TrackServiceRequestResult } from "../Services/serviceRequestService";

export function useRepairTrackingSignalR(
  requestNumber: string | null | undefined,
  onLiveUpdate: (updated: TrackServiceRequestResult) => void
) {
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    if (!requestNumber?.trim()) {
      setIsLiveConnected(false);
      return;
    }

    const unsubscribe = subscribeToRepairTracking(
      requestNumber,
      (updated) => {
        onLiveUpdate(updated);
      },
      (live) => {
        setIsLiveConnected(live);
      }
    );

    return () => {
      unsubscribe();
      setIsLiveConnected(false);
    };
  }, [requestNumber, onLiveUpdate]);

  return { isLiveConnected };
}

