"use client";
import { useLayoutEffect, useRef, useState } from "react";
import Tile, { type TileSize } from "./Tile";
import { sortHand } from "@/lib/rules";
import { cn } from "@/lib/ui";

interface TileRackProps {
  tiles?: string[];
  size?: TileSize;
  selectedTile?: string | null;
  onSelect?: (tile: string) => void;
  /** Fires on every tile tap regardless of `disabled` (used for tap-to-explain).
   *  Takes priority over `onSelect` when provided. */
  onTileTap?: (tile: string) => void;
  disabled?: boolean;
  highlight?: string[];
  /** Single horizontal row (scrolls) instead of wrapping — used for the phone hand. */
  wrap?: boolean;
  /**
   * Scale the whole row down so the entire hand fits the available width (never
   * scrolls, never clipped). Used for the phone hand so all tiles stay visible
   * within the safe area even in landscape. Implies a single non-wrapping row.
   */
  fit?: boolean;
}

export default function TileRack({
  tiles = [],
  size = "m",
  selectedTile,
  onSelect,
  onTileTap,
  disabled = false,
  highlight = [],
  wrap = true,
  fit = false,
}: TileRackProps) {
  const sorted = sortHand(tiles);

  const outerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Measure the natural row width vs the container and scale down to fit.
  useLayoutEffect(() => {
    if (!fit) return;
    const measure = () => {
      const avail = outerRef.current?.clientWidth ?? 0;
      const needed = rowRef.current?.scrollWidth ?? 0;
      setScale(needed > avail && needed > 0 ? Math.max(0.45, avail / needed) : 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (outerRef.current) ro.observe(outerRef.current);
    if (rowRef.current) ro.observe(rowRef.current);
    return () => ro.disconnect();
  }, [fit, sorted.length, size]);

  const row = (
    <div
      ref={rowRef}
      className={cn(
        "flex gap-1 items-end",
        fit ? "flex-nowrap justify-center w-max mx-auto" : wrap ? "flex-wrap justify-center" : "flex-nowrap overflow-x-auto pb-1 justify-center",
      )}
      style={fit ? { transform: `scale(${scale})`, transformOrigin: "center bottom" } : undefined}
    >
      {sorted.map((t) => (
        <Tile
          key={t}
          tileId={t}
          size={size}
          selected={selectedTile === t}
          glow={highlight.includes(t)}
          dim={disabled}
          onClick={onTileTap ? () => onTileTap(t) : disabled || !onSelect ? undefined : () => onSelect(t)}
        />
      ))}
    </div>
  );

  // In fit mode an outer wrapper provides the measured width and clips nothing.
  if (fit) {
    return (
      <div ref={outerRef} className="w-full overflow-hidden flex justify-center">
        {row}
      </div>
    );
  }
  return row;
}
