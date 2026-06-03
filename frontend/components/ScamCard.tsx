"use client";
import { useEffect, useState } from "react";
import Tile from "./Tile";
import type { DnaCard } from "@/lib/tiles";
import { cn } from "@/lib/ui";

interface ScamCardProps {
  card: DnaCard | null;
  tiles?: string[];
  onDone?: () => void;
}

export default function ScamCard({ card, tiles = [], onDone }: ScamCardProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!card) return;
    const t1 = setTimeout(() => setExiting(true), 3600);
    const t2 = setTimeout(() => {
      setExiting(false);
      onDone?.();
    }, 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [card, onDone]);

  if (!card) return null;

  return (
    <div
      className={cn(
        "absolute top-0 left-0 right-0 flex justify-center z-[100]",
        exiting ? "animate-slide-up" : "animate-slide-down",
      )}
    >
      <div className="bg-[linear-gradient(135deg,#1a0505_0%,#2d0a0a_100%)] border-2 border-scam-red rounded-2xl px-7 py-5 max-w-[600px] w-[90%] shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_40px_rgba(185,28,28,0.2)] mt-2">
        {tiles.length > 0 && (
          <div className="flex gap-1 mb-2.5">
            {tiles.slice(0, 3).map((t, i) => (
              <Tile key={i} tileId={t} size="m" />
            ))}
          </div>
        )}
        <div className="text-[1.4rem] font-black text-[#f87171] tracking-[-0.5px] mb-2.5">🚨 {card.title}</div>
        <div className="text-base text-cream mb-2 leading-snug">{card.stat}</div>
        <div className="bg-[rgba(251,191,36,0.1)] border-l-[3px] border-gold px-3 py-2 rounded-r-lg text-[0.9rem] text-gold mb-2">
          🛡 {card.tool}
        </div>
        <div className="text-xs text-sand opacity-70">Source: {card.src}</div>
      </div>
    </div>
  );
}
