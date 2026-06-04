import Tile, { type TileSize } from "./Tile";
import MeldGroup from "./MeldGroup";
import { SEAT_NAMES } from "@/lib/tiles";
import { cn } from "@/lib/ui";
import type { Meld } from "@/lib/types";

interface SeatBlockProps {
  seat: number;
  pairName?: string | null;
  handCount?: number;
  melds?: Meld[];
  isActive?: boolean;
  isBot?: boolean;
  size?: TileSize;
}

export default function SeatBlock({
  seat,
  pairName,
  handCount = 0,
  melds = [],
  isActive,
  isBot,
  size = "s",
}: SeatBlockProps) {
  const backs = Array.from({ length: Math.max(0, handCount) });
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-base text-gold bg-gold/15 rounded-full w-7 h-7 flex items-center justify-center">
          {SEAT_NAMES[seat]}
        </span>
        <span
          className={cn(
            "text-[0.8rem] font-bold rounded-[10px] px-2 py-0.5",
            isActive ? "bg-gold text-ink animate-name-pulse" : "text-cream bg-black/30",
          )}
        >
          {pairName || `Seat ${seat}`}
          {isBot && " 🤖"}
        </span>
      </div>
      <div className="flex gap-0.5 flex-wrap justify-center mt-0.5">
        {backs.map((_, i) => (
          <Tile key={i} back size={size} />
        ))}
      </div>
      {melds.length > 0 && (
        <div className="flex gap-1 flex-wrap justify-center mt-1">
          {melds.map((m, i) => (
            <MeldGroup key={i} meld={m} size={size} />
          ))}
        </div>
      )}
    </div>
  );
}
