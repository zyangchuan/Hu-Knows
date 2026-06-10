"use client";
import { useEffect, useState } from "react";
import Tile from "./Tile";
import CaseStudyView from "./CaseStudyView";
import type { Lesson } from "@/lib/education";
import { getScamCase, type ScamCase } from "@/lib/caseStudies";
import { cn, btnGold, btnGhost } from "@/lib/ui";

export type DisplayMode = "ipad" | "projector";

interface ScamCardProps {
  lesson: Lesson | null;
  /** Host presses continue to resume the game. There is no timer. */
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
          <p className={cn("leading-snug text-cream/75", big ? "text-lg" : "text-[0.85rem]")}>{lesson.lesson}</p>
        </div>
      </div>
      {lesson.tool && (
        <div
          className={cn(
            "rounded-xl font-bold flex flex-col gap-1",
            tone.chip,
            big ? "mt-4 px-6 py-4" : "mt-3 px-4 py-3",
          )}
        >
          <span className={cn("uppercase tracking-[1.5px] opacity-80", big ? "text-sm" : "text-[0.68rem]")}>🛡️ What to do</span>
          <span className={cn("leading-snug", big ? "text-2xl" : "text-[1.1rem]")}>{lesson.tool}</span>
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

// Stage 2: the real-life Singapore case study. The teaching content the younger
// player walks the elder through (also mirrored to each phone).
function CaseBody({ lesson, scamCase, big }: { lesson: Lesson; scamCase: ScamCase; big?: boolean }) {
  const tone = TONE[lesson.tone];
  return (
    <div
      className={cn(
        "bg-[linear-gradient(135deg,#14110c_0%,#241a10_100%)] border-2 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.6)] overflow-y-auto",
        tone.border,
        big ? "w-[min(1000px,92vw)] max-h-[78vh] px-10 py-8" : "w-[min(680px,82vw)] max-h-[72vh] px-6 py-5",
      )}
    >
      <div className={cn("flex items-center mb-4", big ? "gap-4" : "gap-3")}>
        <div className={cn("flex shrink-0", big ? "gap-1.5" : "gap-1")}>
          {lesson.tiles.slice(0, 3).map((t, i) => (
            <Tile key={`${t}-${i}`} tileId={t} size={big ? "l" : "m"} />
          ))}
        </div>
        <div className={cn("font-black tracking-tight", tone.heading, big ? "text-3xl" : "text-xl")}>{lesson.heading}</div>
      </div>
      <CaseStudyView scamCase={scamCase} big={big} />
    </div>
  );
}

// Built on the shared lib/ui buttons, with overlay-specific overrides (pill
// shape, smaller sizing, stronger shadow). Later utilities win the conflict.
const BTN_GOLD = cn(btnGold, "rounded-full px-5 py-2 text-sm shadow-[0_2px_10px_rgba(0,0,0,0.4)]");
const BTN_GHOST = cn(btnGhost, "rounded-full border-[rgba(251,191,36,0.4)] px-4 py-2 font-semibold");

export default function ScamCard({ lesson, onOverride, mode = "ipad" }: ScamCardProps) {
  const [stage, setStage] = useState<"lesson" | "case">("lesson");
  // Every new lesson starts at stage 1.
  useEffect(() => setStage("lesson"), [lesson]);

  if (!lesson) return null;
  const scamCase = getScamCase(lesson.tiles);
  const showCase = stage === "case" && scamCase != null;

  const controls = showCase ? (
    <div className="flex items-center gap-4">
      <button onClick={() => setStage("lesson")} className={BTN_GHOST}>
        ◀ Back
      </button>
      <button onClick={onOverride} className={BTN_GOLD}>
        Got it, continue ▶
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-4">
      <span className="text-sand text-sm">Game paused</span>
      {scamCase ? (
        <button onClick={() => setStage("case")} className={BTN_GOLD}>
          See real example ▶
        </button>
      ) : (
        <button onClick={onOverride} className={BTN_GOLD}>
          Got it, continue ▶
        </button>
      )}
    </div>
  );

  const body = (big?: boolean) =>
    showCase ? <CaseBody lesson={lesson} scamCase={scamCase} big={big} /> : <LessonBody lesson={lesson} big={big} />;

  return (
    <div className="absolute inset-0 z-[160] flex flex-col items-center justify-center gap-3 bg-black/60 px-4 py-6 overflow-y-auto animate-fade-in">
      {mode === "projector" ? (
        <>
          {/* Projector: one big card facing one direction. */}
          {body(true)}
          {controls}
        </>
      ) : showCase ? (
        <>
          {/* The case study is long, so show one upright card on the iPad. The
              same content is mirrored to each phone for close-up reading. */}
          {body()}
          {controls}
        </>
      ) : (
        <>
          {/* Stage 1 is short: mirror it so players on the far side read it upright. */}
          <div className="rotate-180">{body()}</div>
          {controls}
          {body()}
        </>
      )}
    </div>
  );
}
