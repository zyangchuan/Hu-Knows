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
  // Identifies the current connection (role/roomCode/variant). Used to decide
  // whether a re-run of the connect effect can reuse the live socket.
  const sigRef = useRef<string>("");
  // Pending deferred-close from a just-fired cleanup (see below).
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    const sig = `${role}|${roomCode ?? ""}|${variant}`;

    // A previous cleanup may have scheduled a deferred close — cancel it. If this
    // re-run is for the same connection (React StrictMode's dev double-mount, or
    // unchanged deps), we keep the live socket instead of tearing it down
    // mid-handshake (which logs "closed before established" and churns).
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }

    let client = clientRef.current;
    if (!client || sigRef.current !== sig) {
      client?.close();
      client = createGameClient(role, roomCode, variant);
      clientRef.current = client;
      sigRef.current = sig;
    }

    const offMsg = client.onMessage((msg) => onMessageRef.current?.(msg));
    const offStatus = client.onStatus(setConnected);

    return () => {
      offMsg();
      offStatus();
      // Defer the disconnect a tick: if the effect re-runs immediately for the
      // same connection (StrictMode remount), the cancel above keeps the socket
      // alive. A genuine unmount/param change lets this fire and close cleanly.
      const closing = client;
      closeTimer.current = setTimeout(() => {
        closing.close();
        if (clientRef.current === closing) clientRef.current = null;
        sigRef.current = "";
        setConnected(false);
        closeTimer.current = null;
      }, 60);
    };
  }, [role, roomCode, variant]);

  const send = useCallback((msg: ClientMessage) => {
    clientRef.current?.send(msg);
  }, []);

  return { send, connected, reconnecting };
}
