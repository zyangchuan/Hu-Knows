// ─── Mahjong rules: win-check, claims, sorting, wall ──────────────────────────
import { TILE_BASES, type TileInstance } from "./tiles";

export type ClaimType = "HU" | "PUNG" | "CHI";

export interface Claim {
  type: ClaimType;
  tiles: string[];
}

export interface Meld {
  type: "pung" | "chi";
  tiles: string[];
  instanceIds?: string[];
}

function baseOf(t: TileInstance): string {
  return t.split(":")[0];
}

// ── Build / shuffle the wall (4 copies of each base = 100 tiles) ──────────────
export function buildWall(): TileInstance[] {
  const wall: TileInstance[] = [];
  let copy = 0;
  for (const b of TILE_BASES) {
    for (let i = 0; i < 4; i++) wall.push(`${b}:${copy++}`);
  }
  return wall;
}

export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Win detection ─────────────────────────────────────────────────────────────
export function canWin(tiles: TileInstance[], meldCount = 0): boolean {
  const setsNeeded = 3 - meldCount;
  if (tiles.length !== setsNeeded * 3 + 2) return false;
  const bases = tiles.map(baseOf);
  return tryWin(bases, setsNeeded);
}

function tryWin(tileBases: string[], setsNeeded: number): boolean {
  const tiles = [...tileBases].sort();
  const unique = [...new Set(tiles)];
  for (const t of unique) {
    const rest = [...tiles];
    const i1 = rest.indexOf(t);
    rest.splice(i1, 1);
    const i2 = rest.indexOf(t);
    if (i2 === -1) continue;
    rest.splice(i2, 1);
    if (canFormSets(rest, setsNeeded)) return true;
  }
  return false;
}

function canFormSets(tiles: string[], n: number): boolean {
  if (n === 0) return tiles.length === 0;
  const sorted = [...tiles].sort();
  if (sorted.length === 0) return false;
  const t = sorted[0];

  // Try pung
  if (sorted.filter((x) => x === t).length >= 3) {
    const r = [...sorted];
    r.splice(r.indexOf(t), 1);
    r.splice(r.indexOf(t), 1);
    r.splice(r.indexOf(t), 1);
    if (canFormSets(r, n - 1)) return true;
  }

  // Try chi (suit A or B only)
  if (t[0] === "A" || t[0] === "B") {
    const suit = t[0];
    const num = parseInt(t[1]);
    const t2 = `${suit}${num + 1}`;
    const t3 = `${suit}${num + 2}`;
    const r = [...sorted];
    const i1 = r.indexOf(t);
    const i2 = r.indexOf(t2);
    const i3 = r.indexOf(t3);
    if (i1 !== -1 && i2 !== -1 && i3 !== -1) {
      r.splice(r.indexOf(t3), 1);
      r.splice(r.indexOf(t2), 1);
      r.splice(r.indexOf(t), 1);
      if (canFormSets(r, n - 1)) return true;
    }
  }

  return false;
}

// ── Chi options for a discard ─────────────────────────────────────────────────
export function findChiOptions(handBases: string[], discardBase: string): string[][] {
  const suit = discardBase[0];
  if (suit !== "A" && suit !== "B") return [];
  const num = parseInt(discardBase[1]);
  const options: string[][] = [];
  const combos = [
    [num - 2, num - 1, num],
    [num - 1, num, num + 1],
    [num, num + 1, num + 2],
  ];
  for (const [a, b, c] of combos) {
    if (a < 1 || c > 9) continue;
    const needed = [`${suit}${a}`, `${suit}${b}`, `${suit}${c}`].filter((t) => t !== discardBase);
    const handCopy = [...handBases];
    let valid = true;
    for (const need of needed) {
      const idx = handCopy.indexOf(need);
      if (idx === -1) {
        valid = false;
        break;
      }
      handCopy.splice(idx, 1);
    }
    if (valid) options.push([`${suit}${a}`, `${suit}${b}`, `${suit}${c}`]);
  }
  return options;
}

// ── Legal claims a player may make on a discard ───────────────────────────────
export function getLegalClaims(
  hand: TileInstance[],
  discardBase: string,
  seat: number,
  turnSeat: number,
  meldCount = 0,
  playerCount = 4,
): Claim[] {
  const claims: Claim[] = [];
  const handBases = hand.map(baseOf);

  // HU: can the player win with this tile? Account for already-melded sets
  // (brief §4: the original hardcoded meldCount=0 — a melded claimer was never
  // offered a winning HU).
  if (canWin([...handBases, discardBase].map((b, i) => `${b}:${i}`), meldCount)) {
    claims.push({ type: "HU", tiles: [] });
  }

  // PUNG: 2 matching tiles in hand
  const matching = handBases.filter((b) => b === discardBase);
  if (matching.length >= 2) {
    claims.push({ type: "PUNG", tiles: [] });
  }

  // CHI: only from the seat immediately before you
  const prevSeat = (seat - 1 + playerCount) % playerCount;
  if (prevSeat === turnSeat) {
    findChiOptions(handBases, discardBase).forEach((set) => claims.push({ type: "CHI", tiles: set }));
  }

  return claims;
}

// ── Sort a hand: circles, then bamboo, then winds, then dragons ───────────────
const SUIT_ORDER: Record<string, number> = { A: 0, B: 1, W: 2, D: 3 };

export function sortHand(tileInstances: TileInstance[]): TileInstance[] {
  return [...tileInstances].sort((a, b) => {
    const ba = baseOf(a);
    const bb = baseOf(b);
    const suitA = SUIT_ORDER[ba[0]] ?? 9;
    const suitB = SUIT_ORDER[bb[0]] ?? 9;
    if (suitA !== suitB) return suitA - suitB;
    return ba.localeCompare(bb);
  });
}
