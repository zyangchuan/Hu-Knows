"use client";
import { useState } from "react";
import { cn } from "@/lib/ui";
import { TILE_ICONS } from "@/lib/tileIcons";

// Icon source priority:
//   1. AI-generated PNG in /public/tiles/<base>.png  (NEXT_PUBLIC_TILE_IMAGES=1)
//   2. Lucide vector icon, drawn in the suit colour   (default)
//   3. Emoji glyph                                     (last-resort fallback)
const USE_IMAGES = process.env.NEXT_PUBLIC_TILE_IMAGES === "1";

interface TileIconProps {
  base: string;
  emoji: string;
  px: number;
  /** Suit colour class (Lucide draws with currentColor). */
  className?: string;
}

export default function TileIcon({ base, emoji, px, className }: TileIconProps) {
  const [failed, setFailed] = useState(false);

  if (USE_IMAGES && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/tiles/${base}.png`}
        alt=""
        aria-hidden
        draggable={false}
        onError={() => setFailed(true)}
        style={{ width: px, height: px }}
        className="object-contain mix-blend-multiply select-none"
      />
    );
  }

  const Icon = TILE_ICONS[base];
  if (Icon) {
    return <Icon size={px} strokeWidth={2.25} aria-hidden className={cn("shrink-0", className)} />;
  }

  return <span className={cn("leading-none", className)}>{emoji}</span>;
}
