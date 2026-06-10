// ─── Scripted first hand for the guided learn game ────────────────────────────
// A youth walks an elder through Pung → Chi → Hu in one short round. Unlike a
// random game, each seat is dealt a normal-looking VARIED hand but is allowed to
// discard only ONE tile on its turn — the tile that sets up the next player's
// claim. The phone greys out every other tile and the engine enforces it, so the
// chain is guaranteed while the hands still look like real Mahjong hands.
//
//   seat 0 → discards WE  → seat 1 PUNGs (WE WE WE)
//   seat 1 → discards B5  → seat 2 CHIs  (B4 B5 B6)
//   seat 2 → discards A8  → seat 3 HUs   (pairs A8 onto three claimed melds)
//
// This is a teaching sandbox: the 4-copies-per-tile limit is not enforced (the
// rigged hands/melds may repeat a tile across seats).
import type { Meld } from './rules';
import { type TileInstance } from './tiles';

// Unique instance ids without enforcing the 4-copy wall (this is a rigged deal).
const copy: Record<string, number> = {};
const id = (base: string): TileInstance => {
  const i = copy[base] ?? 0;
  copy[base] = i + 1;
  return `${base}:${i}`;
};
const hand = (...bases: string[]): TileInstance[] => bases.map(id);
const pung = (base: string): Meld => ({ type: 'pung', tiles: [base, base, base], instanceIds: [id(base), id(base), id(base)] });
const chi = (a: string, b: string, c: string): Meld => ({ type: 'chi', tiles: [a, b, c], instanceIds: [id(a), id(b), id(c)] });

// The scripted chain tiles.
export const LEAD_TILE = 'WE'; // seat 0 discards → seat 1 PUNGs
export const CHI_TILE = 'B5'; // seat 1 discards → seat 2 CHIs B4 B5 B6
export const HU_TILE = 'A8'; // seat 2 discards → seat 3 HUs (pairs A8)

// Varied, realistic hands. Each seat holds its scripted tile plus ordinary filler.
// The filler is chosen so it never lets another seat make a competing claim on the
// scripted discard (so the intended Pung/Chi/Hu is always the only legal claim).
export const LEARN_HANDS: Record<number, TileInstance[]> = {
  0: hand('WE', 'A1', 'A2', 'A4', 'B1', 'B3', 'B8', 'DR', 'DG', 'WN'),
  1: hand('WE', 'WE', 'B5', 'A3', 'A6', 'A9', 'B2', 'DG', 'WW', 'WN'),
  2: hand('B4', 'B6', 'A8', 'A2', 'A5', 'B9', 'WS', 'DR', 'B1', 'A7'),
  3: hand('A8'),
};

// Seat 3 already has three claimed melds (a Chi + two Pungs) and is one tile from a
// win, so the A8 completes its pair. Three melds also satisfies MIN_MELDS_TO_HU.
export const LEARN_MELDS: Record<number, Meld[]> = {
  0: [],
  1: [],
  2: [],
  3: [chi('A1', 'A2', 'A3'), pung('WW'), pung('B7')],
};

// The one tile each seat is permitted to discard on its scripted turn. The phone
// greys out every other tile and the engine rejects any other discard. Seat 3 has
// no entry — it never discards, it Hus off seat 2's tile.
export const FORCED_DISCARD: Record<number, string> = {
  0: LEAD_TILE, // makes seat 1 Pung
  1: CHI_TILE, // makes seat 2 Chi
  2: HU_TILE, // makes seat 3 Hu
};

// Wall: varied filler; only ever drawn from if a human lets a claim window lapse so
// play falls through to normal turns. The first draw (pop) is a neutral tile.
export const LEARN_WALL: TileInstance[] = [];
for (let i = 0; i < 8; i++) for (const b of ['A5', 'B3', 'A7', 'B6', 'DG', 'A2']) LEARN_WALL.push(id(b));
LEARN_WALL.push(id('A5'));
