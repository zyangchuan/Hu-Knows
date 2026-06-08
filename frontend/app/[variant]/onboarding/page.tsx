"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createProfile, defaultNameFor, useSession, type UserRole } from "@/lib/auth";
import { btnGold, cn, feltRadial, inputField } from "@/lib/ui";

export default function OnboardingPage() {
  const { variant: rawVariant } = useParams<{ variant: string }>();
  const variant = rawVariant === "app" ? "app" : "demo";
  const router = useRouter();
  const { user, loading } = useSession();

  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("volunteer");
  const [organisation, setOrganisation] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Not signed in → back to login. Prefill name from the Google identity.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/${variant}/login`);
      return;
    }
    setName((n) => n || defaultNameFor(user));
  }, [loading, user, router, variant]);

  const submit = async () => {
    if (!user) return;
    if (!name.trim() || !organisation.trim()) {
      setErr("Please fill in your name and organisation.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await createProfile({
        supabase_user_id: user.id,
        name: name.trim(),
        email: user.email ?? "",
        role,
        organisation: organisation.trim(),
      });
      router.replace(`/${variant}/dashboard`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create your profile.");
      setBusy(false);
    }
  };

  return (
    <div className={cn("min-h-[100dvh] flex flex-col items-center justify-center safe-pad gap-6", feltRadial)}>
      <div className="text-center">
        <h1 className="text-[1.8rem] font-black text-gold">Complete your profile</h1>
        <p className="text-sand mt-1 text-[0.9rem]">A few details so we can track your VIA hours.</p>
      </div>

      <div className="w-full max-w-[380px] bg-white/[0.04] border border-[rgba(251,191,36,0.2)] rounded-2xl p-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-[0.7rem] uppercase tracking-wide text-sand">
          Full name
          <input className={inputField} value={name} onChange={(e) => setName(e.target.value)} placeholder="Tan Wei Jie" />
        </label>

        <label className="flex flex-col gap-1 text-[0.7rem] uppercase tracking-wide text-sand">
          Role
          <div className="flex gap-2">
            {(["volunteer", "organiser"] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-sm font-semibold border capitalize transition-colors cursor-pointer",
                  role === r
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-white/15 text-sand hover:text-cream hover:border-white/30",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </label>

        <label className="flex flex-col gap-1 text-[0.7rem] uppercase tracking-wide text-sand">
          Organisation
          <input className={inputField} value={organisation} onChange={(e) => setOrganisation(e.target.value)} placeholder="Riverside Secondary School" />
        </label>

        {err && <p className="text-[#f87171] text-[0.8rem]">{err}</p>}

        <button className={cn(btnGold)} onClick={submit} disabled={busy || loading}>
          {busy ? "Saving…" : "Create profile →"}
        </button>
      </div>
    </div>
  );
}
