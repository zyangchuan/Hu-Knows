import { TILE_DATA, type Suit } from "@/lib/tiles";
import { cn } from "@/lib/ui";
import TileIcon from "./TileIcon";

export type TileSize = "s" | "m" | "l" | "xl";

interface TileProps {
  tileId?: string;
  size?: TileSize;
  selected?: boolean;
  glow?: boolean;
  dim?: boolean;
  back?: boolean;
  onClick?: () => void;
}

// Bigger tiles than the original — readable on real iPad/phone screens.
const SIZE: Record<TileSize, { box: string; px: number; label: string; num: string }> = {
  s: { box: "w-[36px] h-[48px] p-[2px_1px] rounded-[4px]", px: 24, label: "hidden", num: "text-[10px]" },
  m: { box: "w-[52px] h-[70px] p-[3px_2px] rounded-[5px]", px: 30, label: "text-[8px]", num: "text-[12px]" },
  l: { box: "w-[72px] h-[96px] p-[5px_4px] rounded-[7px]", px: 44, label: "text-[11px]", num: "text-[15px]" },
  xl: { box: "w-[108px] h-[146px] p-[10px_7px] rounded-[10px] border-b-[3px]", px: 74, label: "text-[14px]", num: "text-[22px]" },
};

const SUIT: Record<Suit, { bg: string; ink: string }> = {
  circles: { bg: "bg-[linear-gradient(180deg,#faf0d0_0%,#f5e9c8_55%,#e6d6a8_100%)]", ink: "text-suit-blue" },
  bamboo: { bg: "bg-[linear-gradient(180deg,#faf0d0_0%,#f5e9c8_55%,#e6d6a8_100%)]", ink: "text-suit-green" },
  wind: { bg: "bg-[linear-gradient(180deg,#f6e0d4_0%,#efd0bc_55%,#e2bca0_100%)]", ink: "text-suit-wind" },
  dragon: { bg: "bg-[linear-gradient(180deg,#fde9a8_0%,#f8db86_55%,#e8c660_100%)]", ink: "text-amber" },
};

const BASE =
  "relative inline-flex flex-col items-center justify-center select-none shrink-0 text-center text-ink " +
  "border border-bevel-dk border-b-2 border-r-[1.5px] " +
  "shadow-[0_1px_2px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.5)] " +
  "transition-[transform,box-shadow] duration-150";

export default function Tile({ tileId, size = "m", selected, glow, dim, back, onClick }: TileProps) {
  const sz = SIZE[size];

  if (back) {
    return (
      <div
        title="Hidden tile"
        onClick={onClick}
        className={cn(
          BASE,
          sz.box,
          "bg-[repeating-linear-gradient(45deg,#2f6f4d_0_4px,#1f5a3f_4px_8px)] border-[#143b27] border-b-[#0d2a1c]",
          glow && "animate-tile-pulse [box-shadow:0_0_0_2px_var(--color-gold),0_0_14px_rgba(251,191,36,0.35)]",
          dim && "opacity-40",
          onClick && "cursor-pointer",
        )}
      />
    );
  }

  const baseId = typeof tileId === "string" ? tileId.split(":")[0] : tileId;
  const data = baseId ? TILE_DATA[baseId] : undefined;
  if (!data || !baseId) return null;
  const suit = SUIT[data.suit];

  return (
    <div
      title={`${data.label} — ${data.tip}`}
      onClick={onClick}
      className={cn(
        BASE,
        sz.box,
        suit.bg,
        onClick && "cursor-pointer hover:-translate-y-1",
        selected && "-translate-y-3 [box-shadow:0_0_0_3px_var(--color-gold),0_10px_18px_rgba(0,0,0,0.45)] z-10",
        selected && onClick && "hover:-translate-y-3.5",
        glow &&
          "animate-tile-pulse [box-shadow:0_0_0_2px_var(--color-gold),0_0_14px_rgba(251,191,36,0.35),0_1px_2px_rgba(0,0,0,0.22)]",
        dim && "opacity-40",
      )}
    >
      {/* Consistent corner marker: number for suits, the character for honours. */}
      <span
        className={cn(
          "absolute top-[2px] left-[4px] font-bold opacity-65",
          data.num !== null ? "font-num" : "font-hanzi",
          sz.num,
          suit.ink,
        )}
      >
        {data.num !== null ? data.num : data.hanzi}
      </span>
      <TileIcon base={baseId} emoji={data.icon} px={sz.px} className={suit.ink} />
      {sz.label !== "hidden" && (
        <span
          className={cn(
            "font-bold uppercase tracking-[0.2px] leading-[1.0] mt-0.5 max-w-full px-0.5 text-center line-clamp-2 [overflow-wrap:anywhere]",
            sz.label,
          )}
        >
          {data.label}
        </span>
      )}
    </div>
  );
}
