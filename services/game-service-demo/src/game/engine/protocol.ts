// ─── Shared game types + the client/server message protocol ───────────────────
// Mirrors frontend/lib/types.ts so the same UI talks to this real backend.
// See GAME_MECHANIC_BRIEF.md §8.
import type { Claim, ClaimType, Meld } from './rules';
import type { DnaCard, TileInstance } from './tiles';
import type { Lesson } from './education';

export type { Claim, ClaimType, Meld };

export type Phase =
  | 'idle'
  | 'lobby'
  | 'dealing'
  | 'playing'
  | 'claim_window'
  | 'hand_over'
  | 'game_over';

export interface SeatInfo {
  seat: number;
  pairName: string | null;
  connected?: boolean;
  isBot?: boolean;
  handCount?: number;
  melds?: Meld[];
}

export interface DiscardEntry {
  tile: TileInstance;
  bySeat: number;
}

export interface ClaimWindowState {
  bySeat: number;
  closesAt: number;
  legalBySeat: Record<number, Claim[]>;
}

/** Snapshot broadcast to every client (STATE_UPDATE payload). */
export interface GameState {
  phase: Phase;
  handNumber: number;
  turnSeat: number;
  lastDiscard: TileInstance | null;
  lastDiscardSeat: number | null;
  wallCount: number;
  discardPile: DiscardEntry[];
  seats: SeatInfo[];
  claimWindow: ClaimWindowState | null;
}

export interface TableSummaryRow {
  seat: number;
  pairName: string | null;
  wins: number;
}

// ── Messages: client → server ─────────────────────────────────────────────────
// State is retrieved on connection (clientId + roomCode in the handshake auth), so
// there is no rejoin message.
// HOST namespace: CREATE_ROOM, ADD_BOT, START_GAME, RESUME
// PLAYER namespace: JOIN_ROOM, DISCARD, CLAIM
export type ClientMessage =
  | { type: 'CREATE_ROOM' }
  | { type: 'JOIN_ROOM'; roomCode: string; pairName: string }
  | { type: 'ADD_BOT'; seat: number }
  | { type: 'START_GAME' }
  | { type: 'DISCARD'; tile: TileInstance }
  | { type: 'CLAIM'; claimType: ClaimType | null; tiles: string[] }
  | { type: 'RESUME' }
  // DEMO only: host ends the continuously-looping session and shows certificates.
  | { type: 'END_GAME' };

export type ClientMessageType = ClientMessage['type'];

/** Messages a host may send. */
export const HOST_MESSAGE_TYPES: ReadonlySet<ClientMessageType> = new Set([
  'CREATE_ROOM',
  'ADD_BOT',
  'START_GAME',
  'RESUME',
  'END_GAME',
]);

/** Messages a player (phone) may send. */
export const PLAYER_MESSAGE_TYPES: ReadonlySet<ClientMessageType> = new Set([
  'JOIN_ROOM',
  'DISCARD',
  'CLAIM',
]);

// ── Messages: server → client ─────────────────────────────────────────────────
export type ServerMessage =
  | { type: 'ROOM_CREATED'; roomCode: string }
  | { type: 'LOBBY_UPDATE'; seats: SeatInfo[] }
  | { type: 'SEAT_ASSIGNED'; seat: number; pairName: string }
  | { type: 'GAME_STARTED'; dealerSeat: number; handNumber: number }
  | { type: 'DEAL'; hand: TileInstance[] }
  | ({ type: 'STATE_UPDATE' } & GameState)
  | {
      type: 'YOUR_TURN';
      hand: TileInstance[];
      drawnTile: TileInstance | null;
      canWin: boolean;
      mustDiscard: boolean;
      legalClaims: Claim[];
    }
  | {
      type: 'CLAIM_WINDOW_OPEN';
      lastDiscard: TileInstance;
      bySeat: number;
      closesAt: number;
      legalBySeat: Record<number, Claim[]>;
    }
  | {
      type: 'CLAIM_RESOLVED';
      winnerSeat: number;
      claimType: ClaimType;
      meld: string[];
      dna: DnaCard | null;
    }
  | { type: 'SCAM_CARD'; title: string; stat: string; tool: string; src: string }
  | {
      type: 'HU';
      winnerSeat: number;
      pairName: string;
      hand: TileInstance[];
      melds: Meld[];
      winType: string;
    }
  | { type: 'DRAW'; message: string }
  // hostName: a random volunteer/coordinator name (server-generated per room) so
  // the host dashboard and every phone print the same issuer on VIA certificates.
  | { type: 'GAME_OVER'; tableSummary: TableSummaryRow[]; hands: number; hostName: string }
  // Educational pause: a new Pung/Chi this round shows a lesson and freezes play.
  | { type: 'LESSON'; lesson: Lesson; until: number }
  | { type: 'RESUME_GAME' }
  | { type: 'ERROR'; message: string };

export type ServerMessageType = ServerMessage['type'];
