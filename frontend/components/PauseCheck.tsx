"use client";
import { useMemo, useState } from "react";
import { TILE_DATA } from "@/lib/tiles";
import { buildFixOptions, type ScamCase } from "@/lib/caseStudies";
import { btnGold, btnGhost, cn } from "@/lib/ui";

// The in-pause check: right after the youngster teaches the case study, the elder
// tries it. Two quick taps on the real example, spot the scam then pick the safe
// action, each with a reveal. Non-blocking: the host resumes the game when ready.
interface PauseCheckProps {
  base: string;
  scamCase: ScamCase;
}

type Spot = "scam" | "safe";

export default function PauseCheck({ base, scamCase }: PauseCheckProps) {
  const data = TILE_DATA[base];
  const isAction = data?.type === "action";
  const correctSpot: Spot = data?.type === "redflag" ? "scam" : "safe";
  const fixOptions = useMemo(() => buildFixOptions(scamCase), [scamCase]);

  const [step, setStep] = useState<"spot" | "fix">("spot");
  const [spotPick, setSpotPick] = useState<Spot | null>(null);
  const [fixPick, setFixPick] = useState<number | null>(null);

  const spotRight = spotPick === correctSpot;
  const fixRight = fixPick !== null && fixOptions[fixPick].correct;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[0.68rem] uppercase tracking-[2px] text-sand">
        Your turn · step {step === "spot" ? 1 : 2} of 2
      </div>

      {/* The real Singapore case, restated as the thing to judge. */}
      <p className="text-cream/85 text-[0.9rem] leading-snug italic rounded-xl bg-black/25 px-4 py-3">
        &ldquo;{scamCase.example}&rdquo;
      </p>

      {step === "spot" ? (
        <>
          <p className="text-cream text-[0.95rem] font-bold">
            {isAction ? "Is the habit shown here a safe move, or a scam red flag?" : "Is this a scam red flag, or a safe move?"}
          </p>
          {spotPick === null ? (
            <div className="flex flex-col gap-2">
              {isAction ? (
                <>
                  <button className={cn(btnGhost, "w-full")} onClick={() => setSpotPick("safe")}>
                    🛡️ Safe move
                  </button>
                  <button className={cn(btnGhost, "w-full")} onClick={() => setSpotPick("scam")}>
                    🚩 Scam red flag
                  </button>
                </>
              ) : (
                <>
                  <button className={cn(btnGhost, "w-full")} onClick={() => setSpotPick("scam")}>
                    🚩 Scam red flag
                  </button>
                  <button className={cn(btnGhost, "w-full")} onClick={() => setSpotPick("safe")}>
                    🛡️ Safe move
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div
                className={cn(
                  "rounded-lg px-3 py-2 text-center font-bold",
                  spotRight ? "bg-[#1d9e75]/20 text-[#6ee7b7]" : "bg-scam-red/20 text-[#fca5a5]",
                )}
              >
                {spotRight
                  ? "Correct!"
                  : isAction
                    ? "Not quite. This is a safe move: a good habit that keeps you protected."
                    : `Not quite. This is a ${correctSpot === "scam" ? "scam red flag" : "safe move"}.`}
              </div>
              <div className="rounded-xl bg-scam-red/15 border border-scam-red/40 px-4 py-3">
                <div className="uppercase tracking-[1.5px] font-bold text-[#fca5a5] text-[0.66rem]">{isAction ? "💡 Why this habit matters" : "🚩 Warning signs"}</div>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {scamCase.redFlags.map((f, i) => (
                    <li key={i} className="flex gap-2 text-cream/85 text-[0.85rem] leading-snug">
                      <span aria-hidden className="text-[#f87171] shrink-0">
                        •
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button className={cn(btnGold, "w-full")} onClick={() => setStep("fix")}>
                Next: what should you do? →
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-cream text-[0.95rem] font-bold">What should you do?</p>
          {fixPick === null ? (
            <div className="flex flex-col gap-2">
              {fixOptions.map((opt, i) => (
                <button key={i} className={cn(btnGhost, "w-full text-left")} onClick={() => setFixPick(i)}>
                  {opt.text}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                {fixOptions.map((opt, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-full rounded-full px-4 py-2 text-[0.9rem] font-semibold border text-left",
                      opt.correct
                        ? "bg-[#1d9e75]/20 border-[#1d9e75]/50 text-[#6ee7b7]"
                        : i === fixPick
                          ? "bg-scam-red/20 border-scam-red/50 text-[#fca5a5]"
                          : "border-white/10 text-cream/50",
                    )}
                  >
                    {opt.correct ? "✓ " : i === fixPick ? "✕ " : ""}
                    {opt.text}
                  </div>
                ))}
              </div>
              <div
                className={cn(
                  "rounded-lg px-3 py-2 text-center font-bold",
                  fixRight ? "bg-[#1d9e75]/20 text-[#6ee7b7]" : "bg-gold/15 text-gold",
                )}
              >
                {fixRight ? "Well done, that keeps you safe." : "The safe move is highlighted above."}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
