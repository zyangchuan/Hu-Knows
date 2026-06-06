// ─── React hook over the GameClient transport ─────────────────────────────────
import { useCallback, useEffect, useRef, useState } from "react";
import { createGameClient, type ClientRole, type GameClient } from "./net/gameClient";
import type { ClientMessage, ServerMessage } from "./types";

/**
 * Connect to the game-service as a `host` or `player`. Pass `null` to defer the
 * connection until the role is known (e.g. the lobby, before the user chooses
 * Host or Join). The connection (and its namespace) is (re)created when `role`
 * changes.
 */
export function useGameSocket(
  onMessage: (msg: ServerMessage) => void,
  role: ClientRole | null,
  roomCode?: string,
) {
  const clientRef = useRef<GameClient | null>(null);
  const onMessageRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!role) {
      setConnected(false);
      return;
    }
    const client = createGameClient(role, roomCode);
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
  }, [role, roomCode]);

  const send = useCallback((msg: ClientMessage) => {
    clientRef.current?.send(msg);
  }, []);

  return { send, connected };
}
