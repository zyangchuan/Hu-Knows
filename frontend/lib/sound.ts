// ─── Claim sound effects ──────────────────────────────────────────────────────
// Short audio cues played on the shared table when a Pung / Chi / Hu lands. The
// files live in public/audio (served at /audio/*). Playback is best-effort: if the
// browser blocks it (autoplay policy before any interaction) we just swallow the
// rejection rather than throw.
export type ClaimSound = "PUNG" | "CHI" | "HU";

const SRC: Record<ClaimSound, string> = {
  PUNG: "/audio/PUNG.m4a",
  CHI: "/audio/CHI.m4a",
  HU: "/audio/HU.m4a",
};

// One reusable Audio element per sound, created lazily in the browser only.
const cache: Partial<Record<ClaimSound, HTMLAudioElement>> = {};

export function playClaimSound(name: ClaimSound): void {
  if (typeof window === "undefined") return;
  try {
    let audio = cache[name];
    if (!audio) {
      audio = new Audio(SRC[name]);
      audio.preload = "auto";
      cache[name] = audio;
    }
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  } catch {
    // Audio not supported / blocked — sound is non-essential, ignore.
  }
}
