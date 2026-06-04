import Tile, { type TileSize } from "./Tile";
import type { Meld } from "@/lib/types";

interface MeldGroupProps {
  meld: Meld;
  size?: TileSize;
}

export default function MeldGroup({ meld, size = "s" }: MeldGroupProps) {
  if (!meld || !meld.tiles) return null;
  return (
    <div
      title={`${meld.type.toUpperCase()}: ${meld.tiles.join(" ")}`}
      className="flex gap-0.5 items-end bg-black/20 px-1.5 py-1 rounded-md border border-[rgba(251,191,36,0.15)]"
    >
      {meld.tiles.map((t, i) => (
        <Tile key={`${t}-${i}`} tileId={t} size={size} />
      ))}
    </div>
  );
}
