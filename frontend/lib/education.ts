// Turns any Pung/Chi into a plain-language scam-defence lesson for the shared
// iPad — so every claim teaches the elders *why* it matters, not just the stat
// tiles. Pulls in the cited SPF/MAS figures when the tile has one.
import { TILE_DATA, DNA_CARDS } from "./tiles";

export type LessonTone = "redflag" | "shield" | "action" | "connect";

export interface Lesson {
  tone: LessonTone;
  heading: string;
  tiles: string[]; // base ids forming the meld
  lesson: string; // the elaboration / why
  tool?: string; // what to do about it
  stat?: string; // cited figure
  src?: string;
}

function defaultTool(tone: LessonTone): string {
  if (tone === "redflag") return "Pause — don't act on the spot. Verify first, and call 1799 if unsure.";
  if (tone === "shield") return "Keep doing this every single time — good habits beat scammers.";
  return "Share this with someone you trust today.";
}

export function buildLesson(claimType: "PUNG" | "CHI", meld: string[]): Lesson {
  const bases = meld.map((t) => t.split(":")[0]);

  // ── Pung: three of the same — a repeated tactic or a reinforced habit ────────
  if (claimType === "PUNG") {
    const b = bases[0];
    const d = TILE_DATA[b];
    const dna = DNA_CARDS[b];
    const tone: LessonTone = d.type;

    const heading =
      tone === "redflag"
        ? `🚩 Scam tactic: ${d.label}`
        : tone === "shield"
          ? `🛡️ Smart defence: ${d.label}`
          : `✅ Take action: ${d.label}`;

    const lesson =
      tone === "redflag"
        ? `${d.tip}. Seeing the same trick three times is no accident — scammers reuse what works. Spotting the pattern early is how you stop them before any money moves.`
        : tone === "shield"
          ? `${d.tip}. Repeating a safe habit until it's second nature is exactly what keeps you and your savings protected.`
          : `${d.tip}. This one action protects you and everyone you tell.`;

    return { tone, heading, tiles: bases, lesson, tool: dna?.tool ?? defaultTool(tone), stat: dna?.stat, src: dna?.src };
  }

  // ── Chi: a run that brackets a defence between red-flags (or vice-versa). ─────
  // Frame it as "these are the traps, this is the move" rather than a flat list.
  const ds = bases.map((b) => TILE_DATA[b]);
  const flags = ds.filter((d) => d.type === "redflag");
  const guards = ds.filter((d) => d.type !== "redflag");
  const dnaBase = bases.find((b) => DNA_CARDS[b]);
  const dna = dnaBase ? DNA_CARDS[dnaBase] : undefined;

  const flagPart = flags.length
    ? `🚩 The traps — ${flags.map((d) => `${d.label} (${d.tip})`).join(" and ")}.`
    : "";
  const guardPart = guards.length
    ? `🛡️ Your move — ${guards.map((d) => `${d.label} (${d.tip})`).join("; ")}.`
    : "";

  return {
    tone: "connect",
    heading: "🔗 Spot the trap — make the move",
    tiles: bases,
    lesson: `${flagPart} ${guardPart} A scam's warning sign and the way to protect yourself sit side by side on purpose — spot the red flag, then reach for the defence right next to it.`.trim(),
    tool: dna?.tool ?? "Slow down and verify before doing anything — call 1799 if you're unsure.",
    stat: dna?.stat,
    src: dna?.src,
  };
}
