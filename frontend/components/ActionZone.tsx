"use client";
import { useEffect, useRef, useState } from "react";
import type { Claim, ClaimType } from "@/lib/types";
import Tile from "./Tile";
import { btnGhost, btnGold, btnRed, cn } from "@/lib/ui";

interface ClaimWindowLike {
  closesAt: number;
  legalBySeat?: Record<number, Claim[]>;
}

interface ActionZoneProps {
  phase: string;
  isMyTurn: boolean;
  canWin: boolean;
  mustDiscard: boolean;
  selectedTile: string | null;
  claimWindow: ClaimWindowLike | null;
  mySeat: number | null;
  /** The tile on the table this claim window is about (so Pung can preview it). */
  discardTile?: string | null;
  legalClaims?: Claim[];
  onDiscard: (tile: string) => void;
  onHu: () => void;
  onClaim: (type: ClaimType, tiles: string[]) => void;
  onPass: () => void;
}

// A claim button that shows the actual tiles that would form the meld, so it's
// obvious *which* Pung/Chi you're taking (Chi can have several valid runs).
function ClaimButton({
  klass,
  verb,
  term,
  tiles,
  onClick,
}: {
  klass: string;
  verb: string;
  term: string;
  tiles?: string[];
  onClick: () => void;
}) {
  return (
    <button className={cn(klass, "flex items-center gap-2 !px-3 !py-1.5")} onClick={onClick}>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-sm font-extrabold whitespace-nowrap">{verb}</span>
        {term && <span className="text-[0.65rem] font-semibold opacity-80">{term}</span>}
      </span>
      {tiles && tiles.length > 0 && (
        <span className="flex gap-0.5">
          {tiles.map((t, i) => (
            <Tile key={`${t}-${i}`} tileId={t} size="s" />
          ))}
        </span>
      )}
    </button>
  );
}

export default function ActionZone({
  phase,
  isMyTurn,
  canWin,
  mustDiscard,
  selectedTile,
  claimWindow,
  mySeat,
  discardTile,
  legalClaims = [],
  onDiscard,
  onHu,
  onClaim,
  onPass,
}: ActionZoneProps) {
  const [timerPct, setTimerPct] = useState(100);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!claimWindow) {
      setTimerPct(100);
      return;
    }
    const { closesAt } = claimWindow;
    const tick = () => {
      const pct = Math.max(0, ((closesAt - Date.now()) / 4000) * 100);
      setTimerPct(pct);
      if (pct > 0) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [claimWindow]);

  // ── Claim window ────────────────────────────────────────────────────────────
  if (phase === "claim_window" && claimWindow) {
    const myLegal = (mySeat !== null && claimWindow.legalBySeat?.[mySeat]) || legalClaims;
    const hu = myLegal.find((c) => c.type === "HU");
    const pungs = myLegal.filter((c) => c.type === "PUNG");
    const chis = myLegal.filter((c) => c.type === "CHI");
    const dBase = discardTile ? discardTile.split(":")[0] : null;

    const timer = (
      <div className="h-[3px] bg-[rgba(251,191,36,0.2)] rounded-[3px] overflow-hidden -mx-1">
        <div className="h-full bg-gold transition-[width] duration-100 ease-linear" style={{ width: `${timerPct}%` }} />
      </div>
    );

    if (!hu && pungs.length === 0 && chis.length === 0) {
      return (
        <div className="flex flex-col gap-2 py-1">
          {timer}
          <p className="text-xs text-sand text-center">Waiting…</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 py-1">
        {timer}
        <div className="flex gap-2 justify-center flex-wrap">
          {hu ? (
            // If you can win, that's the only thing that matters.
            <ClaimButton klass={btnGold} verb="Win! 🎉" term="胡 Hu" onClick={() => onClaim("HU", [])} />
          ) : (
            <>
              {pungs.map((c, i) => (
                <ClaimButton
                  key={`pung-${i}`}
                  klass={btnRed}
                  verb="Pung"
                  term=""
                  tiles={dBase ? [dBase, dBase, dBase] : undefined}
                  onClick={() => onClaim("PUNG", c.tiles)}
                />
              ))}
              {chis.map((c, i) => (
                <ClaimButton
                  key={`chi-${i}`}
                  klass={btnGold}
                  verb="Connect ↗"
                  term="Chi"
                  tiles={c.tiles}
                  onClick={() => onClaim("CHI", c.tiles)}
                />
              ))}
            </>
          )}
          <button className={cn(btnGhost, "!px-4 !py-1.5")} onClick={onPass}>
            Pass
          </button>
        </div>
      </div>
    );
  }

  // ── My turn ─────────────────────────────────────────────────────────────────
  // Discard lives here in the bottom bar, in the same spot as Pung/Chi: tap a
  // tile in your hand to select it, then press Throw. (Hu shows too if you can win.)
  if (isMyTurn && (canWin || mustDiscard)) {
    const showThrow = mustDiscard && !!selectedTile;
    return (
      <div className="flex gap-2 items-center justify-center py-0.5 flex-wrap">
        {canWin && <ClaimButton klass={btnGold} verb="Win! 🎉" term="胡 Hu" onClick={onHu} />}
        {showThrow ? (
          // Full button only appears once a tile is picked — so it never blocks the hand.
          <button className={cn(btnRed, "flex items-center gap-2 !px-5 !py-1.5")} onClick={() => onDiscard(selectedTile!)}>
            <span className="text-xl">🚮</span>
            <span className="flex flex-col items-start leading-tight">
              <span className="text-sm font-extrabold">Throw</span>
              <span className="text-[0.65rem] font-semibold opacity-80">丢 discard</span>
            </span>
            <span className="flex">
              <Tile tileId={selectedTile!} size="s" />
            </span>
          </button>
        ) : null}
      </div>
    );
  }

  // ── Nothing to do — the zone "breathes" (brief §9) ────────────────────────────
  return (
    <div className="flex items-center justify-center min-h-12">
      <p className="text-xs text-sand/70">Waiting for your turn…</p>
    </div>
  );
}
