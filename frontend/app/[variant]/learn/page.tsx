"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Tile from "@/components/Tile";
import { TILE_DATA } from "@/lib/tiles";
import { btnGold, btnGhost, cn, feltRadial } from "@/lib/ui";

// ─── Interactive "How to play" tutorial ───────────────────────────────────────
// A fully client-side scripted mini-lesson (no backend, no bots, no players). It
// teaches the four moves with the real scam-themed tiles: discard, then the
// three claims Peng / Chi / Hu. The learner performs each move once.

const label = (id: string) => TILE_DATA[id]?.label ?? id;

type StepKey = "intro" | "discard" | "peng" | "chi" | "hu" | "done";
const ORDER: StepKey[] = ["intro", "discard", "peng", "chi", "hu", "done"];
// Steps that count toward the little progress dots (intro/done don't).
const LESSON_STEPS: StepKey[] = ["discard", "peng", "chi", "hu"];

export default function LearnPage() {
  const { variant: rawVariant } = useParams<{ variant: string }>();
  const variant = rawVariant === "app" ? "app" : "demo";
  const router = useRouter();

  const [idx, setIdx] = useState(0);
  const step = ORDER[idx];
  // Whether the current step's required action has been performed.
  const [acted, setActed] = useState(false);
  // Discard step: which tile is picked.
  const [picked, setPicked] = useState<string | null>(null);

  const go = (n: number) => {
    setIdx((i) => Math.min(Math.max(i + n, 0), ORDER.length - 1));
    setActed(false);
    setPicked(null);
  };
  const leave = () => router.push(`/${variant}`);

  const lessonNo = LESSON_STEPS.indexOf(step as StepKey);

  return (
    <div className={cn("min-h-[100dvh] flex flex-col safe-pad", feltRadial)}>
      {/* Top bar: progress + close */}
      <div className="w-full max-w-[640px] mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {LESSON_STEPS.map((s, i) => (
            <span
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all",
                lessonNo === i ? "w-6 bg-gold" : lessonNo > i ? "w-3 bg-gold/60" : "w-3 bg-white/15",
              )}
            />
          ))}
        </div>
        <button onClick={leave} className="text-sand/70 hover:text-cream text-sm">✕ Close</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-5 w-full max-w-[640px] mx-auto text-center">
        {step === "intro" && (
          <Panel
            emoji="🀄"
            title="How to play"
            body="Hu Knows is Mahjong where every tile is a scam tactic or a defence. You'll learn the 4 moves and it takes a minute."
          >
            <div className="flex flex-wrap justify-center gap-2 mt-1">
              {["A1", "A4", "B6", "A8"].map((t) => <Tile key={t} tileId={t} size="m" />)}
            </div>
          </Panel>
        )}

        {step === "discard" && (
          <Panel
            emoji="🖐️"
            title="1 · Your turn: discard"
            body={acted ? "Nice! That's a discard. On your turn you always throw one tile away." : "On your turn you draw a tile, then throw one away. Tap a tile, then press Throw."}
          >
            <div className="flex flex-wrap justify-center gap-1.5 mt-1">
              {["A1", "A4", "B2", "A8", "B6"].map((t) => (
                <Tile
                  key={t}
                  tileId={t}
                  size="l"
                  selected={picked === t}
                  dim={acted && picked !== t}
                  onClick={acted ? undefined : () => setPicked(t)}
                />
              ))}
            </div>
            {!acted && (
              <button
                className={cn(btnGold, "mt-2", !picked && "opacity-40 pointer-events-none")}
                onClick={() => setActed(true)}
              >
                🚮 Throw {picked ? `“${label(picked)}”` : "(pick a tile first)"}
              </button>
            )}
          </Panel>
        )}

        {step === "peng" && (
          <ClaimStep
            emoji="✋"
            title="2 · PENG: three of a kind"
            setup={`South threw “${label("A4")}”. You already hold two of them.`}
            doneText={`PENG! You took all three “${label("A4")}” as a set. Peng = 3 identical tiles.`}
            verb="PENG 碰"
            thrown="A4"
            youHave={["A4", "A4"]}
            result={["A4", "A4", "A4"]}
            acted={acted}
            onClaim={() => setActed(true)}
          />
        )}

        {step === "chi" && (
          <ClaimStep
            emoji="🔗"
            title="3 · CHI: a run of three"
            setup={`The player on your left threw “${label("A5")}”. You hold “${label("A4")}” and “${label("A6")}”.`}
            doneText="CHI! You made a run 4-5-6 in the same suit. Chi = 3 in a row (only from your left)."
            verb="CHI 吃"
            thrown="A5"
            youHave={["A4", "A6"]}
            result={["A4", "A5", "A6"]}
            acted={acted}
            onClaim={() => setActed(true)}
          />
        )}

        {step === "hu" && (
          <Panel
            emoji={acted ? "🏆" : "🎯"}
            title="4 · HU: win!"
            body={acted ? "胡! You completed your hand and won the round. That's Hu!" : "Finish your whole hand (4 sets + a pair) to win. You're one tile away, and it just got thrown. Tap HU!"}
          >
            {/* Your near-complete hand: 3 sets + a pair, with the winning tile incoming. */}
            <div className="flex flex-wrap justify-center items-end gap-2 mt-1">
              <MiniSet tiles={["A4", "A4", "A4"]} caption="Peng" />
              <MiniSet tiles={["A5", "A6", "A7"]} caption="Chi" />
              <MiniSet tiles={["B6", "B6"]} caption="Pair" />
              <MiniSet tiles={acted ? ["B1", "B1", "B1"] : ["B1", "B1"]} caption={acted ? "Hu!" : "Need 1"} gold />
            </div>
            {acted ? (
              <div className="text-[3rem] font-black text-gold animate-hu-bounce mt-1">胡!</div>
            ) : (
              <button className={cn(btnGold, "mt-2")} onClick={() => setActed(true)}>
                🎉 HU 胡: win the round
              </button>
            )}
          </Panel>
        )}

        {step === "done" && (
          <Panel emoji="🎓" title="You're ready!" body="That's everything you need to start playing.">
            <div className="flex flex-col gap-2 mt-1 text-left w-full max-w-[340px]">
              <Rule k="PENG 碰" v="3 identical tiles" tiles={["A4", "A4", "A4"]} />
              <Rule k="CHI 吃" v="3 in a row, same suit" tiles={["A4", "A5", "A6"]} />
              <Rule k="HU 胡" v="complete your hand → win" tiles={["B1", "B1", "B1"]} />
            </div>
            <p className="text-sand text-[0.8rem] mt-1 max-w-[360px]">
              And every tile teaches a real scam defence. Call <strong className="text-gold">1799</strong> if you ever suspect a scam.
            </p>
          </Panel>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="w-full max-w-[640px] mx-auto flex items-center justify-between gap-3">
        <button onClick={() => go(-1)} className={cn("text-sand/70 hover:text-cream text-sm", idx === 0 && "invisible")}>
          ← Back
        </button>
        {step === "done" ? (
          <button className={btnGold} onClick={leave}>Got it, let's play →</button>
        ) : step === "intro" ? (
          <button className={btnGold} onClick={() => go(1)}>Start →</button>
        ) : (
          <button
            className={cn(btnGold, !acted && "opacity-40 pointer-events-none")}
            onClick={() => go(1)}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

function Panel({ emoji, title, body, children }: { emoji: string; title: string; body: string; children?: React.ReactNode }) {
  return (
    <>
      <div className="text-[2.6rem]">{emoji}</div>
      <h2 className="text-gold text-[1.4rem] font-black">{title}</h2>
      <p className="text-cream/90 text-[0.95rem] max-w-[440px] leading-relaxed">{body}</p>
      {children}
    </>
  );
}

// A claim step (Peng/Chi): shows the thrown tile + your tiles, then the formed set.
function ClaimStep({
  emoji, title, setup, doneText, verb, thrown, youHave, result, acted, onClaim,
}: {
  emoji: string; title: string; setup: string; doneText: string; verb: string;
  thrown: string; youHave: string[]; result: string[]; acted: boolean; onClaim: () => void;
}) {
  return (
    <Panel emoji={emoji} title={title} body={acted ? doneText : setup}>
      {acted ? (
        <MiniSet tiles={result} caption={verb.split(" ")[0]} gold />
      ) : (
        <div className="flex flex-col items-center gap-3 mt-1">
          <div className="flex items-end gap-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[0.65rem] uppercase tracking-wide text-sand">thrown</span>
              <Tile tileId={thrown} size="l" glow />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[0.65rem] uppercase tracking-wide text-sand">your tiles</span>
              <div className="flex gap-1">{youHave.map((t, i) => <Tile key={i} tileId={t} size="l" />)}</div>
            </div>
          </div>
          <button className={cn(btnGold, "mt-1")} onClick={onClaim}>{verb}</button>
        </div>
      )}
    </Panel>
  );
}

// A small labelled group of tiles (a set, run, or pair).
function MiniSet({ tiles, caption, gold }: { tiles: string[]; caption: string; gold?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn("flex gap-0.5 p-1.5 rounded-lg border", gold ? "border-gold bg-gold/15" : "border-white/15 bg-black/30")}>
        {tiles.map((t, i) => <Tile key={i} tileId={t} size="s" />)}
      </div>
      <span className={cn("text-[0.65rem] uppercase tracking-wide", gold ? "text-gold" : "text-sand")}>{caption}</span>
    </div>
  );
}

function Rule({ k, v, tiles }: { k: string; v: string; tiles: string[] }) {
  return (
    <div className="flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2">
      <div className="flex gap-0.5">{tiles.map((t, i) => <Tile key={i} tileId={t} size="s" />)}</div>
      <div className="min-w-0">
        <div className="text-gold font-bold text-[0.9rem]">{k}</div>
        <div className="text-sand text-[0.78rem]">{v}</div>
      </div>
    </div>
  );
}
