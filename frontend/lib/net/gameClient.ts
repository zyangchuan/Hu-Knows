// ─── Transport seam ───────────────────────────────────────────────────────────
// The UI talks to the server-authoritative game-service over Socket.IO (same
// origin, behind nginx). The game is entirely server-side — there is no mock.
//
// Two backends, selected by `variant`:
//   - "demo" → /api/game-service-demo  (in-memory, no auth — the /demo flow)
//   - "prod" → /api/game-service        (Redis-backed, host auth — the /prod flow)
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

/** Which game-service backend to talk to. */
export type GameVariant = "demo" | "prod";

const BASE_PATH: Record<GameVariant, string> = {
  demo: "/api/game-service-demo/socket.io",
  prod: "/api/game-service/socket.io",
};

function socketOrigin(): string {
  if (typeof window === "undefined") return "";
  // Local Next dev on :3000 is not nginx, so Socket.IO must go straight to the
  // Docker reverse proxy on port 80. Cookies are host-scoped, not port-scoped.
  if (window.location.port === "3000") return `${window.location.protocol}//${window.location.hostname}`;
  return "";
}

export function createGameClient(
  role: ClientRole,
  roomCode?: string,
  variant: GameVariant = "prod",
): GameClient {
  // host → /host namespace (mahjong board), player → /play namespace (phone UI).
  const namespace = role === "host" ? "/host" : "/play";
  const socket = io(`${socketOrigin()}${namespace}`, {
    path: BASE_PATH[variant],
    // Allow a polling fallback so phones on flaky mobile networks (and
    // backgrounded Safari) always reconnect; reconnect forever with backoff.
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 4000,
    randomizationFactor: 0.4,
    timeout: 8000,
    // withCredentials sends the access_token cookie if host auth is enabled (prod).
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
  socket.io.on("reconnect", () => statusHandlers.forEach((h) => h(true)));

  // iOS Safari suspends sockets when backgrounded; nudge a reconnect the moment
  // the tab/app is visible again rather than waiting for a failed ping.
  const onVisible = () => {
    if (typeof document !== "undefined" && document.visibilityState === "visible" && !socket.connected) {
      socket.connect();
    }
  };
  if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisible);

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
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisible);
      socket.close();
      handlers.clear();
      statusHandlers.clear();
    },
  };
}
