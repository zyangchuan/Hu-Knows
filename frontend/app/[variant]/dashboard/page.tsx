"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchProfile, fetchViaMinutes, signOut, useSession, type Profile } from "@/lib/auth";
import { downloadCertsPdf } from "@/lib/cert";
import { todayLabel } from "@/lib/via";
import { btnGold, btnGhost, cn, feltRadialDeep } from "@/lib/ui";

export default function DashboardPage() {
  const { variant: rawVariant } = useParams<{ variant: string }>();
  const variant = rawVariant === "app" ? "app" : "demo";
  const router = useRouter();
  const { session, loading } = useSession();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [viaMinutes, setViaMinutes] = useState<number | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  const userId = session?.user?.id;

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace(`/${variant}/login`);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const p = await fetchProfile();
        if (cancelled) return;
        if (!p) {
          router.replace(`/${variant}/onboarding`);
          return;
        }
        setProfile(p);
        // VIA hours endpoint is volunteer-only (VolunteerGuard); skip for organisers.
        if (p.role === "volunteer") {
          try {
            setViaMinutes(await fetchViaMinutes());
          } catch {
            setViaMinutes(null);
          }
        }
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load your dashboard.");
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, session, userId, router, variant]);

  const doSignOut = useCallback(async () => {
    await signOut();
    router.replace(`/${variant}/login`);
  }, [router, variant]);

  const viaHours = viaMinutes === null ? null : Math.round((viaMinutes / 60) * 10) / 10;

  const downloadCert = () => {
    if (!profile) return;
    downloadCertsPdf(
      [
        {
          name: profile.name,
          hours: viaHours ?? 0,
          dateLabel: todayLabel(),
          issuedBy: profile.organisation || "Hu Knows",
        },
      ],
      `via-certificate-${profile.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "me"}.pdf`,
    );
  };

  if (loading || status === "loading") {
    return <div className={cn("min-h-[100dvh] flex items-center justify-center text-sand safe-pad", feltRadialDeep)}>Loading…</div>;
  }

  if (status === "error") {
    return (
      <div className={cn("min-h-[100dvh] flex flex-col items-center justify-center gap-4 safe-pad text-center", feltRadialDeep)}>
        <p className="text-[#f87171] max-w-[360px]">{error}</p>
        <button className={btnGhost} onClick={doSignOut}>Sign out</button>
      </div>
    );
  }

  return (
    <div className={cn("min-h-[100dvh] flex flex-col items-center safe-pad gap-6", feltRadialDeep)}>
      {/* Header */}
      <div className="w-full max-w-[560px] flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.6rem] font-black text-gold">VIA Dashboard</h1>
          <p className="text-sand text-sm">{profile?.name}</p>
        </div>
        <button className={cn(btnGhost, "!py-2 !px-4 text-sm")} onClick={doSignOut}>Sign out</button>
      </div>

      {/* VIA hours hero */}
      <div className="w-full max-w-[560px] bg-white/[0.05] border border-[rgba(251,191,36,0.25)] rounded-2xl p-6 flex flex-col items-center gap-1 text-center">
        <span className="text-[0.7rem] uppercase tracking-[2px] text-sand">📜 Your VIA contribution</span>
        {profile?.role === "volunteer" ? (
          <>
            <span className="text-gold text-[2.6rem] font-black leading-none my-1">
              {viaHours ?? 0} <span className="text-[1.1rem]">VIA hour{viaHours === 1 ? "" : "s"}</span>
            </span>
            <span className="text-sand/70 text-[0.78rem]">Values in Action · {todayLabel()}</span>
            <button className={cn(btnGold, "mt-3")} onClick={downloadCert}>
              ⬇️ Download my certificate (PDF)
            </button>
          </>
        ) : (
          <p className="text-sand text-[0.9rem] mt-1 max-w-[360px]">
            VIA hour tracking is for volunteers. As an organiser you can run sessions and issue hours.
          </p>
        )}
      </div>

      {/* Profile */}
      <div className="w-full max-w-[560px] bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-2.5 text-[0.7rem] uppercase tracking-wide text-sand bg-black/30">Profile</div>
        <Row k="Name" v={profile?.name} />
        <Row k="Email" v={profile?.email} />
        <Row k="Role" v={profile?.role} capitalize />
        <Row k="Organisation" v={profile?.organisation} />
      </div>

      <button className="text-sand/70 hover:text-cream text-sm underline" onClick={() => router.push(`/${variant}`)}>
        ← Back to home
      </button>
    </div>
  );
}

function Row({ k, v, capitalize }: { k: string; v?: string; capitalize?: boolean }) {
  return (
    <div className="flex justify-between gap-3 px-4 py-3 border-t border-white/5 text-sm">
      <span className="text-sand">{k}</span>
      <span className={cn("text-cream font-medium truncate", capitalize && "capitalize")}>{v || "—"}</span>
    </div>
  );
}
