import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection
} from "@microsoft/signalr";

const EVENT_NAME = "AnnouncementChanged";

let connection: HubConnection | null = null;
let startPromise: Promise<void> | null = null;

function getConnection(): HubConnection {
  if (connection) {
    return connection;
  }

  connection = new HubConnectionBuilder()
    .withUrl("/hubs/announcements")
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build();

  connection.onreconnecting((error) => {
    console.warn("Announcement SignalR reconnecting:", error);
  });

  connection.onreconnected(() => {
    console.log("Announcement SignalR reconnected.");
  });

  connection.onclose((error) => {
    if (error) {
      console.error("Announcement SignalR closed:", error);
    }
  });

  return connection;
}

async function ensureConnectionStarted(currentConnection: HubConnection) {
  if (currentConnection.state !== HubConnectionState.Disconnected) {
    return;
  }

  try {
    startPromise ??= currentConnection.start();

    await startPromise;

    console.log("Announcement SignalR connected.");
  } catch (error) {
    console.error("Announcement SignalR connection failed:", error);
  } finally {
    startPromise = null;
  }
}

export function startAnnouncementRealtime(onAnnouncementChanged: () => void) {
  const currentConnection = getConnection();

  currentConnection.on(EVENT_NAME, onAnnouncementChanged);

  void ensureConnectionStarted(currentConnection);

  return () => {
    currentConnection.off(EVENT_NAME, onAnnouncementChanged);
  };
}
