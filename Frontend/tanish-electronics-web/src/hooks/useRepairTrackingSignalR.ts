import { useEffect, useState } from "react";
import { subscribeToRepairTracking } from "../Services/repairTrackingRealtimeService";
import { trackServiceRequest, type TrackServiceRequestResult } from "../Services/serviceRequestService";

export function useRepairTrackingSignalR(
  requestNumber: string | null | undefined,
  onLiveUpdate: (updated: TrackServiceRequestResult) => void,
  trackingToken?: string,
  phoneNumber?: string
) {
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  useEffect(() => {
    setIsLiveConnected(false);
    // A number extracted from AI prose is not verification.
    if (!requestNumber?.trim() || !trackingToken) return;
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscribe = (token: string) => {
      if (disposed) return;
      unsubscribe?.();
      unsubscribe = subscribeToRepairTracking(requestNumber, onLiveUpdate,
        live => { if (!disposed) setIsLiveConnected(live); }, token);
    };
    const refresh = async () => {
      if (!phoneNumber || disposed) return;
      try {
        const verified = await trackServiceRequest(requestNumber, phoneNumber);
        if (disposed) return;
        if (verified.trackingToken) {
          // Keep renewal local to this hook: changing the parent's token would
          // restart this effect and create an endless verification request loop.
          const { trackingToken: _capability, ...updated } = verified;
          onLiveUpdate(updated);
          subscribe(verified.trackingToken);
        }
        timer = setTimeout(() => void refresh(), 8 * 60 * 1000);
      } catch {
        if (disposed) return;
        unsubscribe?.();
        unsubscribe = undefined;
        setIsLiveConnected(false);
        timer = setTimeout(() => void refresh(), 60 * 1000);
      }
    };
    // Reverify persisted chat cards too; their saved capability may have expired.
    if (phoneNumber) void refresh(); else subscribe(trackingToken);
    return () => { disposed = true; clearTimeout(timer); unsubscribe?.(); };
  }, [requestNumber, onLiveUpdate, trackingToken, phoneNumber]);
  return { isLiveConnected };
}
