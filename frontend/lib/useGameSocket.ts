// ─── React hook over the GameClient transport ─────────────────────────────────
import { useCallback, useEffect, useRef, useState } from "react";
import { createGameClient, type GameClient } from "./net/gameClient";
import type { ClientMessage, ServerMessage } from "./types";

export function useGameSocket(onMessage: (msg: ServerMessage) => void) {
  const clientRef = useRef<GameClient | null>(null);
  const onMessageRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const client = createGameClient();
    clientRef.current = client;

    const offMsg = client.onMessage((msg) => onMessageRef.current?.(msg));
    const offStatus = client.onStatus(setConnected);

    return () => {
      offMsg();
      offStatus();
      client.close();
      clientRef.current = null;
    };
  }, []);

  const send = useCallback((msg: ClientMessage) => {
    clientRef.current?.send(msg);
  }, []);

  return { send, connected };
}
