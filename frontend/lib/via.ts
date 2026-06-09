// ─── VIA (Values-in-Action) tracking helpers — demo flow ──────────────────────
// On End Game the host turns the table into a VIA Hours record, one row per human
// player. No backend/login: hours are derived from the session, the issuer is the
// (server-generated) host name, dated today. The prod flow tracks real minutes via
// the via-log-service instead. See [[cert.ts]] for the downloadable PDF.
import type { TableSummaryRow } from "./types";

export interface ViaRecord {
  /** The name the player typed when joining (the certificate name). */
  name: string;
  seat: number;
  wins: number;
  /** VIA hours credited for attending the session. */
  hours: number;
}

/** A bot seat (or an empty one) — never gets a VIA record. */
export function isBotName(name: string | null): boolean {
  return !name || name.startsWith("Bot ");
}

/**
 * VIA hours credited for the session. Everyone who attended earns the same — VIA
 * reflects time contributed, not score — scaled gently by how long they played.
 */
export function sessionViaHours(hands: number): number {
  return Math.max(1, Math.min(4, Math.round((hands || 1) / 2)));
}

/** Today's date, formatted for certificates/dashboard (e.g. "8 June 2026"). */
export function todayLabel(): string {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** Convert API-backed VIA minutes to display/certificate hours in tenths. */
export function viaMinutesToHours(minutes: number): number {
  if (minutes <= 0) return 0;
  return Math.max(0.1, Math.round((minutes / 60) * 10) / 10);
}

/** Keep VIA hour labels consistently decimal, e.g. 0.1, 1.0, 2.5. */
export function formatViaHours(hours: number): string {
  return hours.toFixed(1);
}

/** One VIA record per human player, highest VIA hours then most wins first. */
export function buildViaRecords(tableSummary: TableSummaryRow[], hands: number): ViaRecord[] {
  const hours = sessionViaHours(hands);
  return tableSummary
    .filter((r) => !isBotName(r.pairName))
    .map((r) => ({ name: r.pairName as string, seat: r.seat, wins: r.wins, hours }))
    .sort((a, b) => b.hours - a.hours || b.wins - a.wins);
}
