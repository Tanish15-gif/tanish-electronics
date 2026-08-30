import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection
} from "@microsoft/signalr";
import { getAccessToken } from "./customAuthService";
import type { AdminNotification } from "./adminNotificationService";
import type { CustomerNotification } from "./customerNotificationService";

const ADMIN_EVENT = "ReceiveAdminNotification";
const CUSTOMER_EVENT = "ReceiveCustomerNotification";

let connection: HubConnection | null = null;
let startPromise: Promise<void> | null = null;

function getNotificationHubConnection(): HubConnection {
  if (connection) {
    return connection;
  }

  connection = new HubConnectionBuilder()
    .withUrl("/hubs/notifications", {
      accessTokenFactory: () => getAccessToken() || ""
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();

  connection.onreconnecting((error) => {
    console.warn("Notification SignalR reconnecting:", error);
  });

  connection.onreconnected(() => {
    console.log("Notification SignalR reconnected.");
  });

  connection.onclose((error) => {
    if (error) {
      console.warn("Notification SignalR closed:", error);
    }
  });

  return connection;
}

async function ensureConnectionStarted(currentConnection: HubConnection) {
  if (currentConnection.state !== HubConnectionState.Disconnected) {
    return;
  }

  const token = getAccessToken();
  if (!token) {
    return;
  }

  try {
    startPromise ??= currentConnection.start();
    await startPromise;
    console.log("Notification SignalR connected.");
  } catch (error) {
    console.warn("Notification SignalR connection failed:", error);
  } finally {
    startPromise = null;
  }
}

export function startAdminNotificationRealtime(
  onNotificationReceived: (notification: AdminNotification) => void
) {
  const currentConnection = getNotificationHubConnection();

  currentConnection.on(ADMIN_EVENT, onNotificationReceived);

  void ensureConnectionStarted(currentConnection);

  return () => {
    currentConnection.off(ADMIN_EVENT, onNotificationReceived);
  };
}

export function startCustomerNotificationRealtime(
  onNotificationReceived: (notification: CustomerNotification) => void
) {
  const currentConnection = getNotificationHubConnection();

  currentConnection.on(CUSTOMER_EVENT, onNotificationReceived);

  void ensureConnectionStarted(currentConnection);

  return () => {
    currentConnection.off(CUSTOMER_EVENT, onNotificationReceived);
  };
}

export async function stopNotificationHubConnection() {
  if (connection && connection.state !== HubConnectionState.Disconnected) {
    try {
      await connection.stop();
      connection = null;
    } catch (error) {
      console.warn("Error stopping Notification SignalR:", error);
    }
  }
}

