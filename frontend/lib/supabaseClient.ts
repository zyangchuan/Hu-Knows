// ─── Supabase browser client (prod /app flow) ────────────────────────────────
// Client-side auth only — no backend changes. The publishable ("anon") key is
// safe to ship to the browser; never put the secret key here.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Name of the cookie the NestJS guards read the JWT from (default access_token). */
export const AUTH_COOKIE = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || "access_token";

let client: SupabaseClient | null = null;

/** Lazily create the singleton browser client. Returns null if env is missing. */
export function getSupabase(): SupabaseClient | null {
  if (client) return client;
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
export const supabaseConfigured = Boolean(url && anonKey);
