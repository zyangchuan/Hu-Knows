// ─── Shared Tailwind class strings (keeps repeated styling DRY) ───────────────

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const btnGold =
  "bg-gradient-to-br from-gold to-gold-deep text-ink rounded-[10px] px-6 py-3.5 text-base font-extrabold tracking-[0.3px] shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50 disabled:cursor-default";

export const btnRed =
  "bg-gradient-to-br from-[#dc2626] to-[#991b1b] text-white rounded-[10px] px-6 py-3.5 text-base font-extrabold shadow-[0_2px_8px_rgba(0,0,0,0.25)] cursor-pointer animate-pulse-red transition-transform hover:scale-[1.03]";

export const btnGhost =
  "bg-transparent text-sand border border-[rgba(212,180,131,0.35)] rounded-[10px] px-5 py-2.5 text-sm cursor-pointer transition-colors hover:border-gold hover:text-cream";

export const inputField =
  "bg-white/[0.07] border border-[rgba(212,180,131,0.3)] rounded-lg px-3.5 py-2.5 text-cream text-base w-full outline-none transition-colors focus:border-gold placeholder:text-[rgba(212,180,131,0.45)]";

export const sectionLabel =
  "text-[0.7rem] text-sand font-semibold uppercase tracking-[0.8px] mb-0.5";

// Radial felt-table background used by lobby / iPad / phone shells.
export const feltRadial =
  "bg-[radial-gradient(ellipse_at_center,var(--color-felt-warm)_0%,var(--color-felt)_55%,var(--color-felt-deep)_100%)]";
export const feltRadialDeep =
  "bg-[radial-gradient(ellipse_at_center,var(--color-felt-warm)_0%,var(--color-felt-deep)_100%)]";
