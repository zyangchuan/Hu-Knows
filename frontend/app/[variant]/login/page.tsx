"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { signInWithGoogle, useSession } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabaseClient";
import { btnGold, cn, feltRadial } from "@/lib/ui";

export default function LoginPage() {
  const { variant: rawVariant } = useParams<{ variant: string }>();
  const variant = rawVariant === "app" ? "app" : "demo";
  const router = useRouter();
  const { session, loading } = useSession();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Already signed in → straight to the dashboard.
  useEffect(() => {
    if (!loading && session) router.replace(`/${variant}/dashboard`);
  }, [loading, session, router, variant]);

  const onGoogle = async () => {
    setBusy(true);
    setErr("");
    try {
      const origin = window.location.origin;
      await signInWithGoogle(`${origin}/${variant}/dashboard`);
      // Redirects away to Google; nothing else runs here.
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign-in failed");
      setBusy(false);
    }
  };

  return (
    <div className={cn("min-h-[100dvh] flex flex-col items-center justify-center safe-pad gap-6", feltRadial)}>
      <div className="text-center">
        <h1 className="text-[2rem] font-black text-gold tracking-tight">胡 Hu Knows</h1>
        <p className="text-sand mt-1">Volunteer &amp; organiser sign-in</p>
      </div>

      <div className="w-full max-w-[360px] bg-white/[0.04] border border-[rgba(251,191,36,0.2)] rounded-2xl p-7 flex flex-col gap-4 items-center">
        <p className="text-cream/90 text-[0.9rem] text-center">
          Sign in to issue and track VIA (Values in Action) hours.
        </p>

        {!supabaseConfigured ? (
          <p className="text-[#f87171] text-[0.85rem] text-center">
            Auth isn&apos;t configured — set <code className="text-sand">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-sand">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </p>
        ) : (
          <button
            onClick={onGoogle}
            disabled={busy || loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-[#1f1f1f] font-semibold rounded-lg px-4 py-2.5 hover:bg-white/90 transition-colors disabled:opacity-60 cursor-pointer"
          >
            <GoogleMark />
            {busy ? "Redirecting…" : "Continue with Google"}
          </button>
        )}

        {err && <p className="text-[#f87171] text-[0.8rem] text-center">{err}</p>}
      </div>

      <button className="text-sand/70 hover:text-cream text-sm underline" onClick={() => router.push(`/${variant}`)}>
        ← Back
      </button>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}
