import Tile, { type TileSize } from "./Tile";
import type { DiscardEntry } from "@/lib/types";

interface DiscardPoolProps {
  discardPile?: DiscardEntry[];
  lastDiscard?: string | null;
  size?: TileSize;
  /** Keep the most recent N visible so big tiles never clip the newest discard. */
  maxVisible?: number;
}

export default function DiscardPool({ discardPile = [], lastDiscard, size = "m", maxVisible = 36 }: DiscardPoolProps) {
  const shown = discardPile.length > maxVisible ? discardPile.slice(-maxVisible) : discardPile;
  return (
    <div className="w-full h-full flex flex-wrap content-center justify-center items-center gap-1.5 p-3 overflow-hidden">
      {shown.map((entry, i) => (
        <Tile key={`${entry.tile}-${i}`} tileId={entry.tile} size={size} glow={entry.tile === lastDiscard} />
      ))}
    </div>
  );
}
