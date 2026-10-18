import {
  HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection
} from "@microsoft/signalr";
import type { TrackServiceRequestResult } from "./serviceRequestService";

type Listener = { update: (data: TrackServiceRequestResult) => void; status?: (live: boolean) => void };
type Room = { token: string; listeners: Set<Listener>; revision: number; live: boolean };
const rooms = new Map<string, Room>();
let connection: HubConnection | null = null;
let startPromise: Promise<void> | null = null;

function setLive(room: Room, live: boolean) {
  room.live = live;
  room.listeners.forEach(listener => listener.status?.(live));
}

function getConnection(): HubConnection {
  if (connection) return connection;
  connection = new HubConnectionBuilder().withUrl("/hubs/repair-tracking")
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning).build();
  connection.on("ReceiveRepairUpdated", (data: TrackServiceRequestResult) => {
    const room = rooms.get(data?.requestNumber?.trim().toUpperCase());
    room?.listeners.forEach(listener => listener.update(data));
  });
  connection.onreconnecting(() => rooms.forEach(room => setLive(room, false)));
  connection.onclose(() => rooms.forEach(room => setLive(room, false)));
  connection.onreconnected(() => rooms.forEach((room, number) => void join(number, room)));
  return connection;
}

async function join(number: string, room: Room) {
  const revision = ++room.revision;
  const hub = getConnection();
  try {
    if (hub.state === HubConnectionState.Disconnected && !startPromise) {
      startPromise = hub.start().finally(() => { startPromise = null; });
    }
    if (startPromise) await startPromise;
    if (rooms.get(number) !== room || revision !== room.revision) return;
    if (hub.state !== HubConnectionState.Connected) { setLive(room, false); return; }
    await hub.invoke("JoinTracking", number, room.token);
    if (rooms.get(number) === room && revision === room.revision) setLive(room, true);
    else if (!rooms.has(number)) void hub.invoke("LeaveTracking", number).catch(() => {});
  } catch {
    if (rooms.get(number) === room && revision === room.revision) setLive(room, false);
  }
}

export function subscribeToRepairTracking(
  requestNumber: string,
  onUpdate: (updatedData: TrackServiceRequestResult) => void,
  onStatusChange?: (isLive: boolean) => void,
  trackingToken?: string
) {
  if (!requestNumber?.trim() || !trackingToken?.trim()) {
    onStatusChange?.(false);
    return () => {};
  }
  const number = requestNumber.trim().toUpperCase();
  let room = rooms.get(number);
  const isNew = !room;
  const changedToken = room?.token !== trackingToken;
  if (!room) {
    room = { token: trackingToken, listeners: new Set(), revision: 0, live: false };
    rooms.set(number, room);
  }
  room.token = trackingToken;
  const listener: Listener = { update: onUpdate, status: onStatusChange };
  room.listeners.add(listener);
  onStatusChange?.(room.live);
  if (isNew || changedToken) void join(number, room);
  return () => {
    room.listeners.delete(listener);
    if (room.listeners.size || rooms.get(number) !== room) return;
    ++room.revision;
    rooms.delete(number);
    if (connection?.state === HubConnectionState.Connected)
      void connection.invoke("LeaveTracking", number).catch(() => {});
  };
}
