// ─── Game engine (ported from frontend/lib/mock/engine.ts) ────────────────────
// Server-authoritative Mahjong: turns, the 4-second claim window, claim priority
// (HU > PUNG > CHI), and win resolution. The server is the only brain.
// See GAME_MECHANIC_BRIEF.md §4–5.
import { canWin, getLegalClaims, shuffle, type Claim, type Meld } from './rules';
import { getDnaCard, type DnaCard, type TileInstance } from './tiles';
import type { SessionClaim, TableSummaryRow } from './protocol';
import { LEARN_HANDS, LEARN_MELDS, LEARN_WALL, FORCED_DISCARD } from './learn-deal';

const TILE_BASES = [
  'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9',
  'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9',
  'WE', 'WS', 'WW', 'WN',
  'DR', 'DG', 'DW',
];

// LEARN: a win requires having claimed at least this many patterns (Pung/Chi)
// first, so a player can't Hu off a pre-dealt near-complete hand — they must
// actually collect patterns. The claim-rich preset deal makes this reachable.
const MIN_MELDS_TO_HU = 3;

// LEARN: how long the Pung/Chi/Hu claim window stays open. The normal game uses
// 4s; here it's much longer so learners (a youth explaining to an elder) have time
// to spot and make the claim before it disappears.
const CLAIM_WINDOW_MS = 30000;

function buildWall(): TileInstance[] {
  const wall: TileInstance[] = [];
  let copy = 0;
  for (const b of TILE_BASES) {
    for (let i = 0; i < 4; i++) wall.push(`${b}:${copy++}`);
  }
  return wall;
}

function baseOf(t: TileInstance): string {
  return t.split(':')[0];
}

export interface EngineSeat {
  seat: number;
  pairName: string | null;
  isBot?: boolean;
}

interface ClaimWindow {
  discardTile: TileInstance;
  bySeat: number;
  closesAt: number;
  claims: Record<number, Claim | null>;
  legalBySeat: Record<number, Claim[]>;
}

// Event payloads emitted by the engine.
export interface EngineEvents {
  hand_started: { handNumber: number; dealerSeat: number; hands: Record<number, TileInstance[]>; wallCount: number };
  your_turn: {
    seat: number;
    hand: TileInstance[];
    drawnTile: TileInstance | null;
    canWin: boolean;
    mustDiscard: boolean;
    legalClaims: Claim[];
    wallCount: number;
    // LEARN: in the guided round, the one tile base this seat is allowed to discard
    // (the phone greys out every other tile). null in a normal round.
    forcedDiscard: string | null;
  };
  claim_window_open: { lastDiscard: TileInstance; bySeat: number; closesAt: number; legalBySeat: Record<number, Claim[]> };
  claim_resolved: { winnerSeat: number; claimType: 'PUNG' | 'CHI'; meld: string[]; dna: DnaCard | null };
  hu: { winnerSeat: number; pairName: string; hand: TileInstance[]; melds: Meld[]; winType: string };
  draw: { message: string };
  game_over: { tableSummary: TableSummaryRow[]; hands: number; sessionClaims: SessionClaim[] };
}

type EngineHandler<K extends keyof EngineEvents> = (payload: EngineEvents[K]) => void;

/** JSON-serializable snapshot of the engine's data (no timers/handlers). */
export interface EngineSnapshot {
  seats: EngineSeat[];
  phase: GameEngine['phase'];
  handNumber: number;
  dealerSeat: number;
  turnSeat: number;
  wall: TileInstance[];
  hands: Record<number, TileInstance[]>;
  melds: Record<number, Meld[]>;
  discardPile: { tile: TileInstance; bySeat: number }[];
  lastDiscard: TileInstance | null;
  lastDiscardSeat: number | null;
  claimWindow: ClaimWindow | null;
  forcedDiscardBySeat: Record<number, string> | null;
  handScores: Record<number, number>;
  sessionClaims: SessionClaim[];
}

export class GameEngine {
  seats: EngineSeat[];
  phase: 'idle' | 'dealing' | 'playing' | 'claim_window' | 'hand_over' | 'game_over' = 'idle';
  handNumber = 0;
  dealerSeat = 0;
  turnSeat = 0;
  wall: TileInstance[] = [];
  hands: Record<number, TileInstance[]> = {};
  melds: Record<number, Meld[]> = {};
  discardPile: { tile: TileInstance; bySeat: number }[] = [];
  lastDiscard: TileInstance | null = null;
  lastDiscardSeat: number | null = null;
  claimWindow: ClaimWindow | null = null;
  // LEARN: per-seat base each seat is forced to discard in the scripted hand (set
  // when the scripted first hand is dealt, cleared per seat as it discards, null in
  // a normal round). Persisted so the restriction survives a reconnect.
  forcedDiscardBySeat: Record<number, string> | null = null;
  private claimTimer: ReturnType<typeof setTimeout> | null = null;
  private handlers: { [K in keyof EngineEvents]?: EngineHandler<K> } = {};
  private handScores: Record<number, number> = {};
  // Every Pung/Chi claimed across the whole session (persists across hands; seeds
  // the end-of-game review). Not cleared in startHand, only on a fresh engine.
  sessionClaims: SessionClaim[] = [];

  // Optional gate: after an educational claim the room can hold progression (the
  // learning pause) and call resume() when the timer elapses or is overridden.
  pauseHook: ((info: { claimType: 'PUNG' | 'CHI'; meld: string[]; winnerSeat: number }, resume: () => void) => void) | null = null;

  private continueOrPause(info: { claimType: 'PUNG' | 'CHI'; meld: string[]; winnerSeat: number }, cont: () => void): void {
    if (this.pauseHook) this.pauseHook(info, cont);
    else cont();
  }

  constructor(seats: EngineSeat[]) {
    this.seats = seats;
    seats.forEach((s) => {
      this.hands[s.seat] = [];
      this.melds[s.seat] = [];
      this.handScores[s.seat] = 0;
    });
  }

  on<K extends keyof EngineEvents>(event: K, handler: EngineHandler<K>): void {
    (this.handlers as Record<string, unknown>)[event] = handler;
  }

  private emit<K extends keyof EngineEvents>(event: K, payload: EngineEvents[K]): void {
    const handler = (this.handlers as Record<string, ((p: EngineEvents[K]) => void) | undefined>)[event];
    handler?.(payload);
  }

  // ── Start a new hand ─────────────────────────────────────────────────────────
  startHand(): void {
    this.handNumber++;
    this.phase = 'dealing';
    this.discardPile = [];
    this.lastDiscard = null;
    this.lastDiscardSeat = null;
    this.claimWindow = null;
    if (this.claimTimer) {
      clearTimeout(this.claimTimer);
      this.claimTimer = null;
    }

    this.seats.forEach((s) => {
      this.hands[s.seat] = [];
      this.melds[s.seat] = [];
    });
    this.forcedDiscardBySeat = null;

    // LEARN: the first hand is a fully scripted Pung → Chi → Hu (see learn-deal.ts)
    // so a youth can walk an elder through all three claims in one short round. The
    // round opens with seat 0 (holding only WE) drawing a WE and discarding it, so
    // seat 1 Pungs, seat 2 Chis, seat 3 Hus. Any later hand falls back to a normal
    // random deal so host-driven re-deals still work.
    if (this.handNumber === 1 && this.seats.every((s) => LEARN_HANDS[s.seat])) {
      this.wall = [...LEARN_WALL];
      this.seats.forEach((s) => {
        this.hands[s.seat] = [...LEARN_HANDS[s.seat]];
        this.melds[s.seat] = LEARN_MELDS[s.seat].map((m) => ({
          ...m,
          tiles: [...m.tiles],
          instanceIds: m.instanceIds ? [...m.instanceIds] : undefined,
        }));
      });
      this.forcedDiscardBySeat = { ...FORCED_DISCARD };
      this.phase = 'playing';
      this.turnSeat = this.dealerSeat;

      this.emit('hand_started', {
        handNumber: this.handNumber,
        dealerSeat: this.dealerSeat,
        hands: this.hands,
        wallCount: this.wall.length,
      });

      this.startTurn();
      return;
    }

    this.wall = shuffle(buildWall());
    for (let i = 0; i < 10; i++) {
      for (const s of this.seats) this.hands[s.seat].push(this.wall.pop()!);
    }

    this.phase = 'playing';
    this.turnSeat = this.dealerSeat;

    this.emit('hand_started', {
      handNumber: this.handNumber,
      dealerSeat: this.dealerSeat,
      hands: this.hands,
      wallCount: this.wall.length,
    });

    this.startTurn();
  }

  private startTurn(): void {
    if (this.wall.length === 0) {
      this.endHandDraw();
      return;
    }
    const drawn = this.wall.pop()!;
    const seat = this.turnSeat;
    this.hands[seat].push(drawn);

    const hand = this.hands[seat];
    const winnable = this.canHu(seat);
    const legalClaims: Claim[] = winnable ? [{ type: 'HU', tiles: [] }] : [];

    this.emit('your_turn', {
      seat,
      hand: [...hand],
      drawnTile: drawn,
      canWin: winnable,
      mustDiscard: !winnable,
      legalClaims,
      wallCount: this.wall.length,
      forcedDiscard: this.forcedDiscardBySeat?.[seat] ?? null,
    });
  }

  discard(seat: number, tileInstance: TileInstance): { ok?: true; error?: string } {
    if (this.phase !== 'playing') return { error: 'Not your turn' };
    if (seat !== this.turnSeat) return { error: 'Not your turn' };

    // LEARN: in the scripted hand a seat may only discard its one allowed tile (the
    // phone greys out the rest); reject anything else so the chain can't be broken.
    const forcedBase = this.forcedDiscardBySeat?.[seat];
    if (forcedBase && baseOf(tileInstance) !== forcedBase) {
      return { error: 'Discard the highlighted tile' };
    }

    const hand = this.hands[seat];
    const idx = hand.indexOf(tileInstance);
    if (idx === -1) return { error: 'Tile not in hand' };

    hand.splice(idx, 1);
    if (forcedBase && this.forcedDiscardBySeat) delete this.forcedDiscardBySeat[seat];
    this.lastDiscard = tileInstance;
    this.lastDiscardSeat = seat;
    this.discardPile.push({ tile: tileInstance, bySeat: seat });

    this.openClaimWindow(tileInstance, seat);
    return { ok: true };
  }

  /** LEARN: a seat may Hu only with a real win shape AND enough claimed melds. */
  private canHu(seat: number): boolean {
    return this.melds[seat].length >= MIN_MELDS_TO_HU && canWin(this.hands[seat], this.melds[seat].length);
  }

  declareHu(seat: number): { ok?: true; error?: string } {
    if (this.phase !== 'playing') return { error: 'Not playing phase' };
    if (seat !== this.turnSeat) return { error: 'Not your turn' };
    if (!this.canHu(seat)) return { error: 'Cannot win' };
    this.resolveHu(seat, 'HU', this.hands[seat], this.melds[seat]);
    return { ok: true };
  }

  private openClaimWindow(discardTile: TileInstance, bySeat: number): void {
    this.phase = 'claim_window';
    const discardBase = baseOf(discardTile);
    const closesAt = Date.now() + CLAIM_WINDOW_MS;

    const legalBySeat: Record<number, Claim[]> = {};
    for (const s of this.seats) {
      if (s.seat === bySeat) continue;
      const claims = getLegalClaims(this.hands[s.seat], discardBase, s.seat, bySeat, this.melds[s.seat].length, 4)
        // LEARN: a winning HU claim only counts once enough patterns are collected.
        .filter((c) => c.type !== 'HU' || this.melds[s.seat].length >= MIN_MELDS_TO_HU);
      if (claims.length > 0) legalBySeat[s.seat] = claims;
    }

    this.claimWindow = { discardTile, bySeat, closesAt, claims: {}, legalBySeat };
    this.emit('claim_window_open', { lastDiscard: discardTile, bySeat, closesAt, legalBySeat });
    this.claimTimer = setTimeout(() => this.resolveClaimWindow(), CLAIM_WINDOW_MS);
  }

  submitClaim(seat: number, claimType: 'HU' | 'PUNG' | 'CHI' | null, tiles: string[]): { ok?: true; error?: string } {
    // Guard on claimWindow too, not just phase: while an educational LESSON
    // pause is held after a resolved Pung/Chi the phase stays "claim_window"
    // but the window itself is already null. Late bot/pass timers from the
    // just-closed window must no-op rather than dereference a null window.
    if (this.phase !== 'claim_window' || !this.claimWindow) return { error: 'No claim window open' };
    const cw = this.claimWindow;
    if (seat === cw.bySeat) return { error: 'Cannot claim your own discard' };
    cw.claims[seat] = claimType ? { type: claimType, tiles } : null;

    const eligibleSeats = Object.keys(cw.legalBySeat).map(Number);
    const allResponded = eligibleSeats.every((s) => s in cw.claims);
    if (allResponded || eligibleSeats.length === 0) {
      if (this.claimTimer) {
        clearTimeout(this.claimTimer);
        this.claimTimer = null;
      }
      this.resolveClaimWindow();
    }
    return { ok: true };
  }

  private resolveClaimWindow(): void {
    if (this.phase !== 'claim_window' || !this.claimWindow) return;
    const cw = this.claimWindow;
    this.claimWindow = null;

    let winner: number | null = null;
    let winnerClaim: Claim | null = null;

    // Priority: HU > PUNG > CHI
    for (const s of this.seats) {
      if (s.seat === cw.bySeat) continue;
      const claim = cw.claims[s.seat];
      if (claim && claim.type === 'HU' && this.melds[s.seat].length >= MIN_MELDS_TO_HU) {
        winner = s.seat;
        winnerClaim = claim;
        break;
      }
    }
    if (winner === null) {
      for (const s of this.seats) {
        if (s.seat === cw.bySeat) continue;
        const claim = cw.claims[s.seat];
        if (claim && claim.type === 'PUNG') {
          winner = s.seat;
          winnerClaim = claim;
          break;
        }
      }
    }
    if (winner === null) {
      const nextSeat = (cw.bySeat + 1) % 4;
      const claim = cw.claims[nextSeat];
      if (claim && claim.type === 'CHI') {
        winner = nextSeat;
        winnerClaim = claim;
      }
    }

    if (winner !== null && winnerClaim !== null) {
      this.executeClaim(winner, winnerClaim, cw.discardTile, cw.bySeat);
    } else {
      this.phase = 'playing';
      this.turnSeat = (cw.bySeat + 1) % 4;
      this.startTurn();
    }
  }

  private executeClaim(seat: number, claim: Claim, discardTile: TileInstance, _fromSeat: number): void {
    const discardBase = baseOf(discardTile);
    const hand = this.hands[seat];

    if (claim.type === 'HU') {
      const tempHand = [...hand, discardTile];
      this.resolveHu(seat, 'HU_CLAIM', tempHand, this.melds[seat], discardTile);
      return;
    }

    if (claim.type === 'PUNG') {
      let removed = 0;
      const newHand: TileInstance[] = [];
      for (const t of hand) {
        if (baseOf(t) === discardBase && removed < 2) {
          removed++;
          continue;
        }
        newHand.push(t);
      }
      const meldInstances = hand.filter((t) => baseOf(t) === discardBase).slice(0, 2);
      meldInstances.push(discardTile);
      this.hands[seat] = newHand;
      this.melds[seat].push({ type: 'pung', tiles: [discardBase, discardBase, discardBase], instanceIds: meldInstances });
      this.sessionClaims.push({ claimType: 'PUNG', bases: [discardBase, discardBase, discardBase], seat });

      this.emit('claim_resolved', {
        winnerSeat: seat,
        claimType: 'PUNG',
        meld: [discardBase, discardBase, discardBase],
        dna: getDnaCard(discardBase),
      });
      this.continueOrPause(
        { claimType: 'PUNG', meld: [discardBase, discardBase, discardBase], winnerSeat: seat },
        () => this.afterClaimDiscard(seat),
      );
      return;
    }

    // CHI
    const chiTiles = claim.tiles;
    const toRemove = chiTiles.filter((t) => t !== discardBase);
    const newHand = [...hand];
    const meldInstances: TileInstance[] = [discardTile];
    for (const need of toRemove) {
      const idx = newHand.findIndex((t) => baseOf(t) === need);
      if (idx !== -1) {
        meldInstances.push(newHand[idx]);
        newHand.splice(idx, 1);
      }
    }
    this.hands[seat] = newHand;
    this.melds[seat].push({ type: 'chi', tiles: chiTiles, instanceIds: meldInstances });
    this.sessionClaims.push({ claimType: 'CHI', bases: [...chiTiles], seat });

    this.emit('claim_resolved', { winnerSeat: seat, claimType: 'CHI', meld: chiTiles, dna: getDnaCard(discardBase) });
    this.continueOrPause({ claimType: 'CHI', meld: chiTiles, winnerSeat: seat }, () => this.afterClaimDiscard(seat));
  }

  private afterClaimDiscard(seat: number): void {
    this.phase = 'playing';
    this.turnSeat = seat;
    const canWinNow = this.canHu(seat);
    this.emit('your_turn', {
      seat,
      hand: [...this.hands[seat]],
      drawnTile: null,
      canWin: canWinNow,
      mustDiscard: true,
      legalClaims: canWinNow ? [{ type: 'HU', tiles: [] }] : [],
      wallCount: this.wall.length,
      forcedDiscard: this.forcedDiscardBySeat?.[seat] ?? null,
    });
  }

  private resolveHu(seat: number, winType: string, hand: TileInstance[], melds: Meld[], _claimedDiscard: TileInstance | null = null): void {
    this.phase = 'hand_over';
    if (this.claimTimer) {
      clearTimeout(this.claimTimer);
      this.claimTimer = null;
    }
    this.handScores[seat] = (this.handScores[seat] || 0) + 1;
    const seatInfo = this.seats.find((s) => s.seat === seat);

    this.emit('hu', {
      winnerSeat: seat,
      pairName: seatInfo ? (seatInfo.pairName ?? `Seat ${seat}`) : `Seat ${seat}`,
      hand,
      melds,
      winType,
    });
    // Wait for the host to continue (no auto-advance to the next hand).
  }

  private endHandDraw(): void {
    this.phase = 'hand_over';
    this.emit('draw', { message: 'Wall exhausted — no winner this hand' });
    // Wait for the host to continue (no auto-advance to the next hand).
  }

  /**
   * Host-driven progression from `hand_over` to the next hand. DEMO: the session
   * never auto-ends — it keeps dealing new hands until the host presses End Game.
   */
  advanceHand(): void {
    if (this.phase !== 'hand_over') return;
    this.dealerSeat = (this.dealerSeat + 1) % 4;
    this.startHand();
  }

  /** Host pressed "End Game": stop the session now and emit final standings. */
  endGameNow(): void {
    if (this.phase === 'game_over') return;
    this.endGame();
  }

  private endGame(): void {
    this.phase = 'game_over';
    const tableSummary: TableSummaryRow[] = this.seats.map((s) => ({
      seat: s.seat,
      pairName: s.pairName,
      wins: this.handScores[s.seat] || 0,
    }));
    this.emit('game_over', { tableSummary, hands: this.handNumber, sessionClaims: this.sessionClaims });
  }

  /** JSON-serializable snapshot of all game data (timers/handlers excluded). */
  serialize(): EngineSnapshot {
    return {
      seats: this.seats,
      phase: this.phase,
      handNumber: this.handNumber,
      dealerSeat: this.dealerSeat,
      turnSeat: this.turnSeat,
      wall: this.wall,
      hands: this.hands,
      melds: this.melds,
      discardPile: this.discardPile,
      lastDiscard: this.lastDiscard,
      lastDiscardSeat: this.lastDiscardSeat,
      claimWindow: this.claimWindow,
      forcedDiscardBySeat: this.forcedDiscardBySeat,
      handScores: this.handScores,
      sessionClaims: this.sessionClaims,
    };
  }

  /**
   * Rebuild an engine from a snapshot. Timers and event handlers are NOT
   * restored — the caller re-attaches handlers (e.g. via the Room) after this.
   */
  static deserialize(s: EngineSnapshot): GameEngine {
    const engine = new GameEngine(s.seats);
    engine.phase = s.phase;
    engine.handNumber = s.handNumber;
    engine.dealerSeat = s.dealerSeat;
    engine.turnSeat = s.turnSeat;
    engine.wall = s.wall;
    engine.hands = s.hands;
    engine.melds = s.melds;
    engine.discardPile = s.discardPile;
    engine.lastDiscard = s.lastDiscard;
    engine.lastDiscardSeat = s.lastDiscardSeat;
    engine.claimWindow = s.claimWindow;
    engine.forcedDiscardBySeat = s.forcedDiscardBySeat ?? null;
    engine.handScores = s.handScores;
    engine.sessionClaims = s.sessionClaims ?? [];
    return engine;
  }

  /**
   * The current `your_turn` payload for a seat if it is that seat's turn to act
   * (used to restore action state on reconnect), else null. `drawnTile` is null
   * because the drawn tile is already part of the hand.
   */
  turnStateFor(seat: number): {
    hand: TileInstance[];
    drawnTile: TileInstance | null;
    canWin: boolean;
    mustDiscard: boolean;
    legalClaims: Claim[];
    forcedDiscard: string | null;
  } | null {
    if (this.phase !== 'playing' || this.turnSeat !== seat) return null;
    const hand = this.hands[seat];
    const winnable = this.canHu(seat);
    return {
      hand: [...hand],
      drawnTile: null,
      canWin: winnable,
      mustDiscard: !winnable,
      legalClaims: winnable ? [{ type: 'HU', tiles: [] }] : [],
      forcedDiscard: this.forcedDiscardBySeat?.[seat] ?? null,
    };
  }

  getState() {
    return {
      phase: this.phase,
      handNumber: this.handNumber,
      turnSeat: this.turnSeat,
      lastDiscard: this.lastDiscard,
      lastDiscardSeat: this.lastDiscardSeat,
      wallCount: this.wall.length,
      discardPile: this.discardPile,
      seats: this.seats.map((s) => ({
        seat: s.seat,
        pairName: s.pairName,
        handCount: this.hands[s.seat].length,
        melds: this.melds[s.seat],
        isBot: s.isBot || false,
      })),
      claimWindow: this.claimWindow
        ? {
            bySeat: this.claimWindow.bySeat,
            closesAt: this.claimWindow.closesAt,
            legalBySeat: this.claimWindow.legalBySeat,
          }
        : null,
    };
  }
}
