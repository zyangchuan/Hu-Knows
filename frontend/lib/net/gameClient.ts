// ─── Transport seam ───────────────────────────────────────────────────────────
// The UI talks to the game server only through this interface. Today it's backed
// by the in-browser mock; flip NEXT_PUBLIC_GAME_TRANSPORT=socketio to point at the
// real game-service (Socket.IO at /api/game-service) with no UI changes.
import { io } from "socket.io-client";
import type { ClientMessage, ServerMessage } from "../types";
import { getMockBus, type Envelope } from "../mock/mockServer";

export interface GameClient {
  send(msg: ClientMessage): void;
  onMessage(cb: (msg: ServerMessage) => void): () => void;
  onStatus(cb: (connected: boolean) => void): () => void;
  connected(): boolean;
  close(): void;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `c_${Math.random().toString(36).slice(2)}${Date.now()}`;
}

// ── Mock backend (BroadcastChannel + in-browser engine) ───────────────────────
function createMockClient(): GameClient {
  const id = makeId();
  const bus = getMockBus();
  const handlers = new Set<(msg: ServerMessage) => void>();

  const unsub = bus.subscribe((env: Envelope) => {
    if (env.kind === "to-client" && env.to === id) {
      for (const h of handlers) h(env.msg);
    }
  });

  return {
    send(msg) {
      bus.post({ kind: "to-server", from: id, msg });
    },
    onMessage(cb) {
      handlers.add(cb);
      return () => handlers.delete(cb);
    },
    onStatus(cb) {
      // The mock is always "connected" once mounted.
      cb(true);
      return () => {};
    },
    connected() {
      return true;
    },
    close() {
      bus.post({ kind: "disconnect", from: id });
      unsub();
      handlers.clear();
    },
  };
}

// ── Socket.IO backend (real game-service; not active until enabled) ───────────
function createSocketClient(): GameClient {
  const socket = io({ path: "/api/game-service/socket.io", transports: ["websocket"] });
  const handlers = new Set<(msg: ServerMessage) => void>();
  const statusHandlers = new Set<(c: boolean) => void>();

  socket.on("message", (msg: ServerMessage) => {
    for (const h of handlers) h(msg);
  });
  socket.on("connect", () => statusHandlers.forEach((h) => h(true)));
  socket.on("disconnect", () => statusHandlers.forEach((h) => h(false)));

  return {
    send(msg) {
      socket.emit("message", msg);
    },
    onMessage(cb) {
      handlers.add(cb);
      return () => handlers.delete(cb);
    },
    onStatus(cb) {
      statusHandlers.add(cb);
      cb(socket.connected);
      return () => statusHandlers.delete(cb);
    },
    connected() {
      return socket.connected;
    },
    close() {
      socket.close();
      handlers.clear();
      statusHandlers.clear();
    },
  };
}

export function createGameClient(): GameClient {
  const transport = process.env.NEXT_PUBLIC_GAME_TRANSPORT ?? "mock";
  return transport === "socketio" ? createSocketClient() : createMockClient();
}
