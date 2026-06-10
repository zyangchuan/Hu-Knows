"use client";
import Tile from "./Tile";
import { TILE_DATA } from "@/lib/tiles";
import { whatToDo } from "@/lib/education";
import { cn } from "@/lib/ui";

// Tap-to-explain popup for a single tile. Works for every tile (all have an
// example + a "what to do" line), not just the ones with a DNA stat card.
const TONE: Record<string, { border: string; label: string; chip: string; badge: string }> = {
  redflag: { border: "border-scam-red", label: "🚩 Scam red flag", chip: "bg-scam-red/20 text-[#fca5a5]", badge: "text-[#f87171]" },
  shield: { border: "border-[#1d9e75]", label: "🛡️ Smart defence", chip: "bg-[#1d9e75]/20 text-[#6ee7b7]", badge: "text-[#34d399]" },
  action: { border: "border-gold", label: "✅ Take action", chip: "bg-gold/20 text-gold", badge: "text-gold" },
};

interface TileInfoCardProps {
  base: string;
  onClose: () => void;
}

export default function TileInfoCard({ base, onClose }: TileInfoCardProps) {
  const data = TILE_DATA[base];
  if (!data) return null;
  const tone = TONE[data.type] ?? TONE.redflag;

  return (
    <div
      className={cn(
        "w-full max-w-[440px] mx-auto shrink-0 bg-[linear-gradient(135deg,#14110c_0%,#241a10_100%)] border-2 rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.5)] px-5 pt-4 pb-4 animate-fade-in",
        tone.border,
      )}
    >
      <div className="flex items-start gap-4">
        <Tile tileId={base} size="l" />
        <div className="flex-1 min-w-0">
          <div className={cn("text-[0.72rem] font-bold uppercase tracking-wide", tone.badge)}>{tone.label}</div>
          <div className="text-cream text-[1.15rem] font-black leading-tight">{data.label}</div>
          <p className="text-cream/75 text-[0.85rem] leading-snug mt-1">{data.example}</p>
        </div>
        <button onClick={onClose} title="Close" className="text-sand/60 hover:text-cream text-lg leading-none shrink-0">
          ✕
        </button>
      </div>

      <div className={cn("rounded-xl font-bold flex flex-col gap-1 mt-3 px-4 py-3", tone.chip)}>
        <span className="uppercase tracking-[1.5px] opacity-80 text-[0.68rem]">🛡️ What to do</span>
        <span className="text-[1.05rem] leading-snug">{whatToDo(base)}</span>
      </div>
    </div>
  );
}
