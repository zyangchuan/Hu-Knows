// ─── Auth + profile/VIA API helpers (prod /app flow) ─────────────────────────
// Pure client-side: Supabase handles auth; we mirror the access token into the
// cookie the NestJS guards read, then call the existing user-service / via-log
// HTTP endpoints (no backend changes). Same-origin in prod via nginx.
"use client";
import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { AUTH_COOKIE, getSupabase } from "./supabaseClient";

export type UserRole = "volunteer" | "organiser";

export interface Profile {
  supabase_user_id: string;
  name: string;
  email: string;
  role: UserRole;
  organisation: string;
}

// ── Cookie sync ───────────────────────────────────────────────────────────────
// The guards read request.cookies[access_token]; Supabase keeps the session in
// localStorage, so we copy the JWT into that cookie (same-origin → sent to /api).
function setAuthCookie(token: string, expiresInSec = 3600) {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=${token}; path=/; max-age=${expiresInSec}; SameSite=Lax`;
}
function clearAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
function syncCookie(session: Session | null) {
  if (session?.access_token) {
    const ttl = session.expires_in ?? 3600;
    setAuthCookie(session.access_token, ttl);
  } else {
    clearAuthCookie();
  }
}

// ── Session hook ──────────────────────────────────────────────────────────────
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      syncCookie(data.session);
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      syncCookie(s);
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

// ── Auth actions ──────────────────────────────────────────────────────────────
export async function signInWithGoogle(redirectTo: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_* env).");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw error;
}

export async function signOut() {
  clearAuthCookie();
  await getSupabase()?.auth.signOut();
}

// ── user-service / via-log API ────────────────────────────────────────────────
const USERS_URL = "/api/user-service/users";
const VIA_ME_URL = "/api/via-log-service/via-logs/me";

/** GET /users/me — returns the profile, or null if none exists yet (needs onboarding). */
export async function fetchProfile(): Promise<Profile | null> {
  const r = await fetch(`${USERS_URL}/me`, { credentials: "include" });
  if (r.status === 401) throw new Error("unauthorized");
  if (!r.ok) return null; // 404 / not found → no profile yet
  return (await r.json()) as Profile;
}

/** POST /users — create the profile (open endpoint; role + organisation required). */
export async function createProfile(input: {
  supabase_user_id: string;
  name: string;
  email: string;
  role: UserRole;
  organisation: string;
}): Promise<Profile> {
  const r = await fetch(USERS_URL, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!r.ok) {
    const msg = await r.text().catch(() => "");
    throw new Error(`Failed to create profile (${r.status}) ${msg}`);
  }
  return (await r.json()) as Profile;
}

/** GET /via-logs/me — accumulated VIA minutes for the signed-in volunteer. */
export async function fetchViaMinutes(): Promise<number> {
  const r = await fetch(VIA_ME_URL, { credentials: "include" });
  if (!r.ok) throw new Error(`Failed to load VIA hours (${r.status})`);
  const data = (await r.json()) as { via_minutes?: number };
  return data.via_minutes ?? 0;
}

/** Default name from a Google identity (full_name → name → email local-part). */
export function defaultNameFor(user: User | null): string {
  const m = user?.user_metadata as { full_name?: string; name?: string } | undefined;
  return m?.full_name || m?.name || user?.email?.split("@")[0] || "";
}
