// ─── Transport seam ───────────────────────────────────────────────────────────
// The UI talks to the server-authoritative game-service over Socket.IO at
// /api/game-service. The game is entirely server-side — there is no client mock.
import { io } from "socket.io-client";
import type { ClientMessage, ServerMessage } from "../types";
import { getClientId } from "./clientIdentity";

export interface GameClient {
  send(msg: ClientMessage): void;
  onMessage(cb: (msg: ServerMessage) => void): () => void;
  onStatus(cb: (connected: boolean) => void): () => void;
  connected(): boolean;
  close(): void;
}

/**
 * Which game-service Socket.IO namespace to connect to:
 * - `host`   → `/host`  (the shared table; renders the mahjong board)
 * - `player` → `/play`  (a phone; renders the player interface)
 */
export type ClientRole = "host" | "player";

export function createGameClient(role: ClientRole, roomCode?: string): GameClient {
  // host → /host namespace (mahjong board), player → /play namespace (phone UI).
  const namespace = role === "host" ? "/host" : "/play";
  const socket = io(namespace, {
    path: "/api/game-service/socket.io",
    transports: ["websocket"],
    // withCredentials sends the access_token cookie if host auth is re-enabled.
    withCredentials: true,
    // clientId identifies the device; roomCode (when set) makes the server replay
    // the current game state on connection — no rejoin message needed.
    auth: { clientId: getClientId(), ...(roomCode ? { roomCode } : {}) },
  });
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
