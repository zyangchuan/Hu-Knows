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
  size = "m",
}: SeatBlockProps) {
  const backs = Array.from({ length: Math.max(0, handCount) });
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="text-lg text-gold bg-gold/15 rounded-full w-9 h-9 flex items-center justify-center shrink-0">
          {SEAT_NAMES[seat]}
        </span>
        <span
          className={cn(
            "text-base font-bold rounded-full px-3 py-1 whitespace-nowrap",
            isActive ? "bg-gold text-ink animate-name-pulse" : "text-cream bg-black/30",
          )}
        >
          {pairName || `Seat ${seat}`}
          {isBot && " 🤖"}
        </span>
      </div>

      {/* Hidden tiles: a compact overlapping fan (concealed, so kept small). */}
      <div className="flex [&>*:not(:first-child)]:-ml-[20px]">
        {backs.map((_, i) => (
          <Tile key={i} back size="s" />
        ))}
      </div>

      {melds.length > 0 && (
        <div className="flex gap-1.5 flex-wrap justify-center max-w-[26vw]">
          {melds.map((m, i) => (
            <MeldGroup key={i} meld={m} size={size} />
          ))}
        </div>
      )}
    </div>
  );
}
