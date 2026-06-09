"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth";
import AppHeader from "./AppHeader";
import { cn, feltRadialDeep } from "@/lib/ui";

// Auth gate for the /app (full-backend) flow: every page except login requires a
// Supabase session. Demo pages are never gated (handled in the layout).
const PUBLIC = /\/login(\/|$)/;

export default function AppGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useSession();
  const isPublic = PUBLIC.test(pathname);

  useEffect(() => {
    if (!loading && !session && !isPublic) router.replace("/app/login");
  }, [loading, session, isPublic, router]);

  if (isPublic) return <>{children}</>;
  if (loading || !session) {
    return (
      <div className={cn("min-h-[100dvh] flex items-center justify-center text-sand", feltRadialDeep)}>
        <div className="w-8 h-8 border-[3px] border-[rgba(251,191,36,0.2)] border-t-gold rounded-full animate-spin-fast" />
      </div>
    );
  }
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
