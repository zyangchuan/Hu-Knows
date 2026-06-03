"use client";
import { useEffect, useRef, useState } from "react";
import type { Claim, ClaimType } from "@/lib/types";
import { base } from "@/lib/tiles";
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
  legalClaims?: Claim[];
  onDiscard: (tile: string) => void;
  onHu: () => void;
  onClaim: (type: ClaimType, tiles: string[]) => void;
  onPass: () => void;
}

// Plain-English verb + Mahjong term (brief §9).
function ActionButton({ klass, verb, term, onClick }: { klass: string; verb: string; term: string; onClick: () => void }) {
  return (
    <button className={cn(klass, "flex flex-col items-center leading-tight !py-2")} onClick={onClick}>
      <span className="text-base font-extrabold">{verb}</span>
      <span className="text-[0.7rem] font-semibold opacity-80">{term}</span>
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
    const hasHu = myLegal.some((c) => c.type === "HU");
    const hasPung = myLegal.some((c) => c.type === "PUNG");
    const hasChi = myLegal.some((c) => c.type === "CHI");

    const timer = (
      <div className="h-[3px] bg-[rgba(251,191,36,0.2)] rounded-[3px] overflow-hidden -mx-1">
        <div className="h-full bg-gold transition-[width] duration-100 ease-linear" style={{ width: `${timerPct}%` }} />
      </div>
    );

    if (!hasHu && !hasPung && !hasChi) {
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
          {hasHu && <ActionButton klass={btnGold} verb="Win! 🎉" term="胡 Hu" onClick={() => onClaim("HU", [])} />}
          {hasPung && !hasHu && (
            <ActionButton
              klass={btnRed}
              verb="Grab it 🚨"
              term="Pung"
              onClick={() => {
                const c = myLegal.find((x) => x.type === "PUNG");
                onClaim("PUNG", c?.tiles || []);
              }}
            />
          )}
          {hasChi && !hasHu && (
            <ActionButton
              klass={btnGhost}
              verb="Connect them ↗"
              term="Chi"
              onClick={() => {
                const c = myLegal.find((x) => x.type === "CHI");
                onClaim("CHI", c?.tiles || []);
              }}
            />
          )}
          <ActionButton klass={btnGhost} verb="Pass" term="skip" onClick={onPass} />
        </div>
      </div>
    );
  }

  // ── My turn ─────────────────────────────────────────────────────────────────
  if (isMyTurn) {
    return (
      <div className="flex flex-col gap-2 py-1">
        <div className="flex gap-2 justify-center flex-wrap">
          {canWin && <ActionButton klass={btnGold} verb="Win! 🎉" term="胡 Hu" onClick={onHu} />}
          {mustDiscard && selectedTile && (
            <button className={btnRed} onClick={() => onDiscard(selectedTile)}>
              Discard {base(selectedTile)}
            </button>
          )}
          {mustDiscard && !selectedTile && (
            <p className="text-[0.8rem] text-sand text-center">Tap a tile to discard</p>
          )}
        </div>
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
