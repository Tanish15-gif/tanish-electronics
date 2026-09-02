import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection
} from "@microsoft/signalr";
import type { TrackServiceRequestResult } from "./serviceRequestService";

const REPAIR_UPDATED_EVENT = "ReceiveRepairUpdated";

let connection: HubConnection | null = null;
let startPromise: Promise<void> | null = null;

function getRepairTrackingHubConnection(): HubConnection {
  if (connection) {
    return connection;
  }

  connection = new HubConnectionBuilder()
    .withUrl("/hubs/repair-tracking")
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();

  return connection;
}

async function ensureConnectionStarted(
  hubConnection: HubConnection
): Promise<boolean> {
  if (
    (hubConnection.state as HubConnectionState) === HubConnectionState.Connected
  ) {
    return true;
  }

  if (
    (hubConnection.state as HubConnectionState) ===
    HubConnectionState.Disconnected
  ) {
    try {
      startPromise = hubConnection.start();
      await startPromise;
      return true;
    } catch (error) {
      console.warn("Repair Tracking SignalR connection failed:", error);
      return false;
    } finally {
      startPromise = null;
    }
  }

  if (startPromise) {
    try {
      await startPromise;
      return (
        (hubConnection.state as HubConnectionState) ===
        HubConnectionState.Connected
      );
    } catch {
      return false;
    }
  }

  return (
    (hubConnection.state as HubConnectionState) === HubConnectionState.Connected
  );
}

export function subscribeToRepairTracking(
  requestNumber: string,
  onUpdate: (updatedData: TrackServiceRequestResult) => void,
  onStatusChange?: (isLive: boolean) => void
) {
  if (!requestNumber?.trim()) {
    return () => {};
  }

  const normalizedRequestNumber = requestNumber.trim().toUpperCase();
  const currentConnection = getRepairTrackingHubConnection();

  const handleUpdate = (data: TrackServiceRequestResult) => {
    if (data?.requestNumber?.toUpperCase() === normalizedRequestNumber) {
      onUpdate(data);
    }
  };

  currentConnection.on(REPAIR_UPDATED_EVENT, handleUpdate);

  const handleReconnected = () => {
    onStatusChange?.(true);
    void currentConnection
      .invoke("JoinTracking", normalizedRequestNumber)
      .catch((err) => {
        console.warn("Failed to rejoin tracking room after reconnect:", err);
      });
  };

  const handleReconnecting = () => {
    onStatusChange?.(false);
  };

  const handleClosed = () => {
    onStatusChange?.(false);
  };

  currentConnection.onreconnected(handleReconnected);
  currentConnection.onreconnecting(handleReconnecting);
  currentConnection.onclose(handleClosed);

  void ensureConnectionStarted(currentConnection).then((connected) => {
    if (connected) {
      onStatusChange?.(true);
      void currentConnection
        .invoke("JoinTracking", normalizedRequestNumber)
        .catch((err) => {
          console.warn("Failed to join tracking room:", err);
        });
    } else {
      onStatusChange?.(false);
    }
  });

  return () => {
    currentConnection.off(REPAIR_UPDATED_EVENT, handleUpdate);

    if (currentConnection.state === HubConnectionState.Connected) {
      void currentConnection
        .invoke("LeaveTracking", normalizedRequestNumber)
        .catch(() => {});
    }
  };
}

