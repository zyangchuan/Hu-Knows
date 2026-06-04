// ─── Bot AI (ported from the original Node server) ────────────────────────────
import type { Claim } from "../rules";
import type { TileInstance } from "../tiles";

function baseOf(t: TileInstance): string {
  return t.split(":")[0];
}

export interface BotTurnInput {
  seat: number;
  hand: TileInstance[];
  drawnTile: TileInstance | null;
  canWin: boolean;
  legalClaims: Claim[];
}

export type BotTurnResult = { action: "HU" } | { action: "DISCARD"; tile: TileInstance };

export function botTurn({ hand, canWin }: BotTurnInput): BotTurnResult {
  if (canWin) return { action: "HU" };
  return { action: "DISCARD", tile: chooseDiscard(hand) };
}

export interface BotClaimInput {
  seat: number;
  legalClaims: Claim[];
  hand: TileInstance[];
}

export function botClaim({ legalClaims }: BotClaimInput): Claim | null {
  if (!legalClaims || legalClaims.length === 0) return null;

  // HU always.
  const hu = legalClaims.find((c) => c.type === "HU");
  if (hu) return hu;

  // PUNG: conservative — pung most of the time.
  const pung = legalClaims.find((c) => c.type === "PUNG");
  if (pung && Math.random() < 0.8) return pung;

  // CHI: 30% of the time.
  const chi = legalClaims.find((c) => c.type === "CHI");
  if (chi && Math.random() < 0.3) return chi;

  return null; // pass
}

// Discard heuristic: drop the most isolated tile, protect pairs/runs.
function chooseDiscard(hand: TileInstance[]): TileInstance {
  const bases = hand.map(baseOf);
  const scores = hand.map((_, i) => {
    const b = bases[i];
    let score = 0;

    // +3 per other tile sharing this base (potential pung).
    score += (bases.filter((x) => x === b).length - 1) * 3;

    // +2 per adjacent suit tile (potential chi).
    if (b[0] === "A" || b[0] === "B") {
      const num = parseInt(b[1]);
      const suit = b[0];
      for (let d = -2; d <= 2; d++) {
        if (d === 0) continue;
        if (bases.includes(`${suit}${num + d}`)) score += 2;
      }
    }
    return score;
  });

  let minScore = Infinity;
  let minIdx = 0;
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] < minScore) {
      minScore = scores[i];
      minIdx = i;
    }
  }
  return hand[minIdx];
}
