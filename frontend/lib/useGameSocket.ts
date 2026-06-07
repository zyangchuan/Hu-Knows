// ─── React hook over the GameClient transport ─────────────────────────────────
import { useCallback, useEffect, useRef, useState } from "react";
import { createGameClient, type ClientRole, type GameClient, type GameVariant } from "./net/gameClient";
import type { ClientMessage, ServerMessage } from "./types";

/**
 * Connect to the game-service as a `host` or `player`. Pass `null` for `role` to
 * defer the connection until it's known (e.g. the lobby). `variant` picks the
 * backend: "demo" (in-memory, no auth) or "prod". The connection is (re)created
 * when role/roomCode/variant changes.
 */
export function useGameSocket(
  onMessage: (msg: ServerMessage) => void,
  role: ClientRole | null,
  roomCode?: string,
  variant: GameVariant = "prod",
) {
  const clientRef = useRef<GameClient | null>(null);
  const onMessageRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);
  // Debounced "outage" flag: only true after the socket has been down for a
  // beat, so a quick reconnect (refresh, Safari foregrounding) doesn't flash
  // "Reconnecting…".
  const [reconnecting, setReconnecting] = useState(false);
  const downTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (connected || !role) {
      if (downTimer.current) { clearTimeout(downTimer.current); downTimer.current = null; }
      setReconnecting(false);
      return;
    }
    if (downTimer.current) return;
    downTimer.current = setTimeout(() => setReconnecting(true), 1200);
    return () => {
      if (downTimer.current) { clearTimeout(downTimer.current); downTimer.current = null; }
    };
  }, [connected, role]);

  useEffect(() => {
    if (!role) {
      setConnected(false);
      return;
    }
    const client = createGameClient(role, roomCode, variant);
    clientRef.current = client;

    const offMsg = client.onMessage((msg) => onMessageRef.current?.(msg));
    const offStatus = client.onStatus(setConnected);

    return () => {
      offMsg();
      offStatus();
      client.close();
      clientRef.current = null;
      setConnected(false);
    };
  }, [role, roomCode, variant]);

  const send = useCallback((msg: ClientMessage) => {
    clientRef.current?.send(msg);
  }, []);

  return { send, connected, reconnecting };
}
