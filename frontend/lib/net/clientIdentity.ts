// ─── Persistent client identity (localStorage) ────────────────────────────────
// Every device gets a stable `clientId` (required by the game-service handshake
// and used to reclaim a session/seat on reconnect). Players additionally store a
// `clientName` (their pair name). The HOST is not a player, so it never sets a
// name — only a clientId.

const CLIENT_ID_KEY = "hu-client-id";
const CLIENT_NAME_KEY = "hu-client-name";

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `c_${Math.random().toString(36).slice(2)}${Date.now()}`;
}

/** Stable per-device client id, created on first use and persisted. */
export function getClientId(): string {
  if (typeof window === "undefined") return makeId();
  let id = window.localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = makeId();
    window.localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

/** The player's saved pair name, or "" if none (e.g. a host has no name). */
export function getClientName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(CLIENT_NAME_KEY) ?? "";
}

/** Persist the player's pair name for reuse across rooms/reconnects. */
export function setClientName(name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLIENT_NAME_KEY, name);
}
