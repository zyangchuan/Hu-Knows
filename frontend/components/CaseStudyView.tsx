"use client";
import type { ScamCase } from "@/lib/caseStudies";
import { cn } from "@/lib/ui";

// The case-study body: what the scam is, one past Singapore example, the red
// flags it reveals, and the actions to take. Pure presentation, no network, so
// the host card (stage 2) and the player phones can share the exact same markup.
// `big` is the projector/large variant.
interface CaseStudyViewProps {
  scamCase: ScamCase;
  big?: boolean;
}

export default function CaseStudyView({ scamCase, big }: CaseStudyViewProps) {
  const heading = big ? "text-base" : "text-[0.7rem]";
  const body = big ? "text-lg" : "text-[0.85rem]";
  const gap = big ? "gap-5" : "gap-3";

  return (
    <div className={cn("flex flex-col", gap)}>
      {scamCase.image && (
        <figure className="m-0">
          <img
            src={scamCase.image.src}
            alt={scamCase.image.caption ?? ""}
            className={cn("w-full rounded-xl object-cover", big ? "max-h-72" : "max-h-44")}
          />
          {scamCase.image.caption && (
            <figcaption className={cn("text-sand mt-1", big ? "text-sm" : "text-[0.72rem]")}>
              {scamCase.image.caption}
            </figcaption>
          )}
        </figure>
      )}

      <section>
        <div className={cn("uppercase tracking-[1.5px] font-bold text-gold/80", heading)}>What this scam is</div>
        <p className={cn("leading-snug text-cream/85 mt-1", body)}>{scamCase.whatItIs}</p>
      </section>

      <section>
        <div className={cn("uppercase tracking-[1.5px] font-bold text-gold/80", heading)}>A real Singapore case</div>
        <p className={cn("leading-snug text-cream/75 mt-1 italic", body)}>{scamCase.example}</p>
      </section>

      <section className={cn("rounded-xl bg-scam-red/15 border border-scam-red/40", big ? "px-5 py-4" : "px-4 py-3")}>
        <div className={cn("uppercase tracking-[1.5px] font-bold text-[#fca5a5]", heading)}>🚩 Red flags to spot</div>
        <ul className={cn("mt-1.5 flex flex-col", big ? "gap-1.5" : "gap-1")}>
          {scamCase.redFlags.map((f, i) => (
            <li key={i} className={cn("flex gap-2 text-cream/85 leading-snug", body)}>
              <span aria-hidden className="text-[#f87171] shrink-0">
                •
              </span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={cn("rounded-xl bg-[#1d9e75]/15 border border-[#1d9e75]/40", big ? "px-5 py-4" : "px-4 py-3")}>
        <div className={cn("uppercase tracking-[1.5px] font-bold text-[#6ee7b7]", heading)}>🛡️ What to do</div>
        <ul className={cn("mt-1.5 flex flex-col", big ? "gap-1.5" : "gap-1")}>
          {scamCase.actions.map((a, i) => (
            <li key={i} className={cn("flex gap-2 text-cream/90 leading-snug font-semibold", body)}>
              <span aria-hidden className="text-[#34d399] shrink-0">
                ✓
              </span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </section>

      {scamCase.link && (
        <a
          href={scamCase.link}
          target="_blank"
          rel="noreferrer"
          className={cn("text-gold underline underline-offset-2 hover:text-gold-deep", big ? "text-base" : "text-[0.8rem]")}
        >
          Read more on the official advisory
        </a>
      )}
    </div>
  );
}
