"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchProfile, signOut, useSession, type Profile } from "@/lib/auth";
import { cn } from "@/lib/ui";

// Small persistent identity badge for the /app flow — shows the signed-in user's
// name + role so it's visible that auth survived navigation/refresh. Hidden on
// the auth pages (login/onboarding), the dashboard (which shows its own profile),
// and the immersive game screens.
const HIDE_ON = /\/(login|onboarding|dashboard|host|play)(\/|$)/;

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);

  const hidden = HIDE_ON.test(pathname);

  useEffect(() => {
    if (hidden || !session) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    fetchProfile()
      .then((p) => !cancelled && setProfile(p))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [hidden, session]);

  if (hidden || loading || !session || !profile) return null;

  const doSignOut = async () => {
    await signOut();
    router.replace("/app/login");
  };

  return (
    <div
      className="fixed z-50 flex items-center gap-2 rounded-full border border-[rgba(251,191,36,0.35)] bg-black/55 backdrop-blur px-3 py-1.5 text-[0.8rem]"
      style={{
        top: "calc(0.5rem + env(safe-area-inset-top))",
        right: "calc(0.5rem + env(safe-area-inset-right))",
      }}
    >
      <span className="text-base leading-none">👤</span>
      <span className="text-cream font-semibold truncate max-w-[40vw]">{profile.name}</span>
      <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide capitalize", "bg-gold/15 text-gold")}>
        {profile.role}
      </span>
      <button
        onClick={() => router.push("/app/dashboard")}
        title="VIA dashboard"
        className="text-sand/80 hover:text-gold text-[0.75rem] font-semibold leading-none"
      >
        Dashboard
      </button>
      <button onClick={doSignOut} title="Sign out" className="text-sand/70 hover:text-[#f87171] ml-0.5 text-[0.95rem] leading-none">
        ⏻
      </button>
    </div>
  );
}
