"use client";
import { useMemo, useState } from "react";
import Tile from "./Tile";
import { TILE_DATA, getDnaCard } from "@/lib/tiles";
import { whatToDo } from "@/lib/education";
import { btnGold, btnGhost, cn } from "@/lib/ui";
import type { SessionClaim } from "@/lib/types";

// End-of-game review: a short text-based scam check built from the tiles that were
// actually Pung'd or Chi'd at the table this session, so players reinforce what they
// saw. Each question shows the scenario, asks scam vs safe, then reveals what to do.
const MAX_QUESTIONS = 5;

type Choice = "scam" | "safe";

interface ReviewQuizProps {
  claims: SessionClaim[];
  onDone: () => void;
}

export default function ReviewQuiz({ claims, onDone }: ReviewQuizProps) {
  // Unique tile bases that were claimed this session, in first-claimed order, capped.
  const bases = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const c of claims) {
      for (const b of c.bases) {
        if (TILE_DATA[b] && !seen.has(b)) {
          seen.add(b);
          out.push(b);
        }
      }
    }
    return out.slice(0, MAX_QUESTIONS);
  }, [claims]);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Choice | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // A game with no Pung/Chi has nothing to review: offer a clean skip.
  if (bases.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-[2.6rem]">🎓</div>
        <h2 className="text-gold text-[1.2rem] font-black">No claims to review this round</h2>
        <button className={cn(btnGold, "w-full max-w-[280px]")} onClick={onDone}>Continue →</button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-[2.6rem]">🎓</div>
        <h2 className="text-gold text-[1.3rem] font-black">Review complete</h2>
        <p className="text-cream text-[1.05rem]">
          You spotted <strong className="text-gold">{score}</strong> of {bases.length} correctly.
        </p>
        <p className="text-sand text-[0.85rem] max-w-[300px]">
          These were the scam tactics and defences claimed at your table today.
        </p>
        <button className={cn(btnGold, "w-full max-w-[280px] mt-1")} onClick={onDone}>
          Continue to certificate →
        </button>
      </div>
    );
  }

  const base = bases[idx];
  const data = TILE_DATA[base];
  const dna = getDnaCard(base);
  const correct: Choice = data.type === "redflag" ? "scam" : "safe";
  const answered = picked !== null;
  const isRight = picked === correct;

  const choose = (c: Choice) => {
    if (answered) return;
    setPicked(c);
    if (c === correct) setScore((s) => s + 1);
  };
  const next = () => {
    if (idx + 1 >= bases.length) {
      setFinished(true);
    } else {
      setIdx((i) => i + 1);
      setPicked(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center gap-4 pt-5 px-4 overflow-y-auto safe-pb">
      <div className="flex gap-1.5">
        {bases.map((_, i) => (
          <span
            key={i}
            className={cn("h-1.5 w-6 rounded-full", i < idx ? "bg-gold" : i === idx ? "bg-gold/60" : "bg-white/15")}
          />
        ))}
      </div>
      <div className="text-[0.7rem] uppercase tracking-[2px] text-sand">
        Scam check {idx + 1} of {bases.length}
      </div>

      <Tile tileId={base} size="xl" />
      <p className="text-cream text-[1rem] leading-snug text-center max-w-[340px]">&ldquo;{data.example}&rdquo;</p>

      {!answered ? (
        <div className="flex flex-col gap-2 w-full max-w-[320px]">
          <p className="text-sand text-[0.85rem] text-center">Is this a scam red flag, or a safe move?</p>
          <button className={cn(btnGhost, "w-full")} onClick={() => choose("scam")}>🚩 Scam red flag</button>
          <button className={cn(btnGhost, "w-full")} onClick={() => choose("safe")}>🛡️ Safe move</button>
        </div>
      ) : (
        <div className="w-full max-w-[340px] flex flex-col gap-3">
          <div
            className={cn(
              "rounded-lg px-3 py-2 text-center font-bold",
              isRight ? "bg-[#1d9e75]/20 text-[#6ee7b7]" : "bg-scam-red/20 text-[#fca5a5]",
            )}
          >
            {isRight ? "Correct!" : `Not quite. This is a ${correct === "scam" ? "scam red flag" : "safe move"}.`}
          </div>
          <div className="rounded-xl bg-gold/15 px-4 py-3 flex flex-col gap-1">
            <span className="uppercase tracking-[1.5px] opacity-80 text-[0.68rem] text-gold">🛡️ What to do</span>
            <span className="text-cream text-[1rem] leading-snug">{whatToDo(base)}</span>
          </div>
          {(dna?.stat || dna?.src) && (
            <div className="text-sand text-[0.75rem] text-center">
              {dna?.stat}
              {dna?.src && <span className="opacity-60"> · {dna.src}</span>}
            </div>
          )}
          <button className={cn(btnGold, "w-full")} onClick={next}>
            {idx + 1 >= bases.length ? "See my result →" : "Next →"}
          </button>
        </div>
      )}
    </div>
  );
}
