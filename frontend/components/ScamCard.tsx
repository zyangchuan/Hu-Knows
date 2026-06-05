"use client";
import { useEffect, useState } from "react";
import Tile from "./Tile";
import type { Lesson } from "@/lib/education";
import { cn } from "@/lib/ui";

export type DisplayMode = "ipad" | "projector";

interface ScamCardProps {
  lesson: Lesson | null;
  /** Epoch ms when the learning pause ends (drives the countdown). */
  until: number;
  onOverride: () => void;
  /** ipad = readable from both sides (mirrored); projector = one big card. */
  mode?: DisplayMode;
}

const TONE: Record<Lesson["tone"], { border: string; heading: string; chip: string }> = {
  redflag: { border: "border-scam-red", heading: "text-[#f87171]", chip: "bg-scam-red/20 text-[#fca5a5]" },
  shield: { border: "border-[#1d9e75]", heading: "text-[#34d399]", chip: "bg-[#1d9e75]/20 text-[#6ee7b7]" },
  action: { border: "border-gold", heading: "text-gold", chip: "bg-gold/20 text-gold" },
  connect: { border: "border-gold", heading: "text-gold", chip: "bg-gold/20 text-gold" },
};

function LessonBody({ lesson, big }: { lesson: Lesson; big?: boolean }) {
  const tone = TONE[lesson.tone];
  return (
    <div
      className={cn(
        "bg-[linear-gradient(135deg,#14110c_0%,#241a10_100%)] border-2 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.6)]",
        tone.border,
        big ? "w-[min(1000px,92vw)] px-10 py-8" : "w-[min(680px,82vw)] px-6 py-4",
      )}
    >
      <div className={cn("flex items-start", big ? "gap-6" : "gap-4")}>
        <div className={cn("flex shrink-0", big ? "gap-1.5" : "gap-1")}>
          {lesson.tiles.slice(0, 3).map((t, i) => (
            <Tile key={`${t}-${i}`} tileId={t} size={big ? "l" : "m"} />
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn("font-black tracking-tight", tone.heading, big ? "text-4xl mb-2" : "text-xl mb-1")}>
            {lesson.heading}
          </div>
          <p className={cn("leading-snug text-cream", big ? "text-2xl" : "text-[1rem]")}>{lesson.lesson}</p>
        </div>
      </div>
      {lesson.tool && (
        <div
          className={cn(
            "rounded-lg font-semibold flex items-start gap-2",
            tone.chip,
            big ? "mt-4 px-5 py-3 text-xl" : "mt-2.5 px-3.5 py-2 text-[0.95rem]",
          )}
        >
          <span className="shrink-0">🛡️ What to do:</span>
          <span>{lesson.tool}</span>
        </div>
      )}
      {(lesson.stat || lesson.src) && (
        <div className={cn("text-sand", big ? "mt-3 text-base" : "mt-2 text-[0.8rem]")}>
          {lesson.stat}
          {lesson.src && <span className="opacity-60"> · {lesson.src}</span>}
        </div>
      )}
    </div>
  );
}

export default function ScamCard({ lesson, until, onOverride, mode = "ipad" }: ScamCardProps) {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (!lesson) return;
    const update = () => setSecs(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 250);
    return () => clearInterval(id);
  }, [lesson, until]);

  if (!lesson) return null;

  const controls = (
    <div className="flex items-center gap-4">
      <span className="text-sand text-sm">
        Game paused · resuming in <span className="text-gold font-bold tabular-nums">{secs}s</span>
      </span>
      <button
        onClick={onOverride}
        className="bg-gradient-to-br from-gold to-gold-deep text-ink rounded-full px-5 py-2 text-sm font-extrabold shadow-[0_2px_10px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-transform cursor-pointer"
      >
        Got it — continue ▶
      </button>
    </div>
  );

  return (
    <div className="absolute inset-0 z-[160] flex flex-col items-center justify-center gap-3 bg-black/60 px-4 animate-fade-in">
      {mode === "ipad" ? (
        <>
          {/* Mirrored so players on the far side of the table read it the right way up. */}
          <div className="rotate-180">
            <LessonBody lesson={lesson} />
          </div>
          {controls}
          <LessonBody lesson={lesson} />
        </>
      ) : (
        <>
          {/* Projector: one big card facing one direction. */}
          <LessonBody lesson={lesson} big />
          {controls}
        </>
      )}
    </div>
  );
}
