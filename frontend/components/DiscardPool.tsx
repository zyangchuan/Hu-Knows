import Tile, { type TileSize } from "./Tile";
import type { DiscardEntry } from "@/lib/types";

interface DiscardPoolProps {
  discardPile?: DiscardEntry[];
  lastDiscard?: string | null;
  size?: TileSize;
}

export default function DiscardPool({ discardPile = [], lastDiscard, size = "m" }: DiscardPoolProps) {
  return (
    <div className="w-full h-full flex flex-wrap content-center justify-center items-center gap-1.5 p-3 overflow-hidden">
      {discardPile.map((entry, i) => (
        <Tile key={`${entry.tile}-${i}`} tileId={entry.tile} size={size} glow={entry.tile === lastDiscard} />
      ))}
    </div>
  );
}
