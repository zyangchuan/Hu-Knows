// ─── Supabase browser client (prod /app flow) ────────────────────────────────
// Client-side auth only — no backend changes. The publishable ("anon") key is
// safe to ship to the browser; never put the secret key here.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface RuntimeConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  authCookieName?: string;
}

declare global {
  interface Window {
    __HU_CONFIG__?: RuntimeConfig;
  }
}

function runtimeConfig(): RuntimeConfig {
  if (typeof window === "undefined") return {};
  return window.__HU_CONFIG__ ?? {};
}

function supabaseUrl(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    runtimeConfig().supabaseUrl
  );
}

function supabaseAnonKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    runtimeConfig().supabaseAnonKey
  );
}

/** Name of the cookie the NestJS guards read the JWT from (default access_token). */
export const AUTH_COOKIE =
  process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ||
  process.env.AUTH_COOKIE_NAME ||
  runtimeConfig().authCookieName ||
  "access_token";

let client: SupabaseClient | null = null;

/** Lazily create the singleton browser client. Returns null if env is missing. */
export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = supabaseUrl();
  const anonKey = supabaseAnonKey();
  if (!url || !anonKey) return null;
  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // completes the OAuth redirect on load
    },
  });
  return client;
}

/** Whether Supabase is configured for the browser. */
export const supabaseConfigured = Boolean(supabaseUrl() && supabaseAnonKey());
