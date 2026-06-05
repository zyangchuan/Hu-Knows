import Tile, { type TileSize } from "./Tile";
import { sortHand } from "@/lib/rules";
import { cn } from "@/lib/ui";

interface TileRackProps {
  tiles?: string[];
  size?: TileSize;
  selectedTile?: string | null;
  onSelect?: (tile: string) => void;
  disabled?: boolean;
  highlight?: string[];
  /** Single horizontal row (scrolls) instead of wrapping — used for the phone hand. */
  wrap?: boolean;
}

export default function TileRack({
  tiles = [],
  size = "m",
  selectedTile,
  onSelect,
  disabled = false,
  highlight = [],
  wrap = true,
}: TileRackProps) {
  const sorted = sortHand(tiles);
  return (
    <div
      className={cn(
        "flex gap-1 justify-center items-end",
        wrap ? "flex-wrap" : "flex-nowrap overflow-x-auto pb-1",
      )}
    >
      {sorted.map((t) => (
        <Tile
          key={t}
          tileId={t}
          size={size}
          selected={selectedTile === t}
          glow={highlight.includes(t)}
          dim={disabled}
          onClick={disabled || !onSelect ? undefined : () => onSelect(t)}
        />
      ))}
    </div>
  );
}
