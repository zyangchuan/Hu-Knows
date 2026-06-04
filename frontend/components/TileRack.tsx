import Tile, { type TileSize } from "./Tile";
import { sortHand } from "@/lib/rules";

interface TileRackProps {
  tiles?: string[];
  size?: TileSize;
  selectedTile?: string | null;
  onSelect?: (tile: string) => void;
  disabled?: boolean;
  highlight?: string[];
}

export default function TileRack({
  tiles = [],
  size = "m",
  selectedTile,
  onSelect,
  disabled = false,
  highlight = [],
}: TileRackProps) {
  const sorted = sortHand(tiles);
  return (
    <div className="flex flex-wrap gap-1 justify-center">
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
