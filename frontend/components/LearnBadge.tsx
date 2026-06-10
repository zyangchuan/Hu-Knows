import { cn } from "@/lib/ui";

// A clear "you are on the guided-learn version" marker, shown on the demo-learn
// lobby and game screens so players know this is the teaching mode (preset
// near-win deal + host how-to-play gate), not a normal game.
export default function LearnBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-gold/20 text-gold border-2 border-gold/50 px-5 py-2 text-[1.05rem] font-black uppercase tracking-[2px]",
        className,
      )}
    >
      🎓 Learn version
    </span>
  );
}
