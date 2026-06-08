"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/ui";

// Cross-browser fullscreen helpers (Safari uses the webkit-prefixed forms).
type FsDoc = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => void };
const fsElement = () => document.fullscreenElement || (document as FsDoc).webkitFullscreenElement || null;

/**
 * One-tap fullscreen toggle. Uses the Fullscreen API where it exists (Android
 * Chrome, desktop, recent iPadOS). iPhone Safari has NO Fullscreen API, so there
 * it falls back to the only real option — guiding the user to Add to Home Screen,
 * which our appleWebApp config launches without any browser chrome.
 */
export default function FullscreenButton({ className }: { className?: string }) {
  const [on, setOn] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Already an installed PWA → already fullscreen, no button needed.
    const standalone =
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
      window.matchMedia?.("(display-mode: standalone)").matches;
    if (standalone) { setHidden(true); return; }
    const sync = () => setOn(!!fsElement());
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  if (hidden) return null;

  const toggle = async () => {
    const el = document.documentElement as FsEl;
    const doc = document as FsDoc;
    try {
      if (fsElement()) {
        await (document.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
        return;
      }
      if (el.requestFullscreen) { await el.requestFullscreen(); return; }
      if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); return; }
      // iPhone Safari: no API available.
      alert("To go fullscreen on iPhone:\n\n1. Tap the Share button (□↑)\n2. Add to Home Screen\n3. Open it from the new icon");
    } catch {
      alert("To go fullscreen on iPhone: Share → Add to Home Screen, then open from the icon.");
    }
  };

  return (
    <button
      onClick={toggle}
      title="Fullscreen"
      className={cn(
        "rounded-full border border-[rgba(251,191,36,0.4)] text-sand hover:text-cream hover:border-gold px-3 py-1.5 text-[0.8rem] font-semibold transition-colors cursor-pointer bg-black/30 backdrop-blur",
        className,
      )}
    >
      {on ? "🡼 Exit fullscreen" : "⛶ Fullscreen"}
    </button>
  );
}
