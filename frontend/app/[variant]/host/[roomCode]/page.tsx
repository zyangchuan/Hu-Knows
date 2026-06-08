"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameSocket } from "@/lib/useGameSocket";
import SeatBlock from "@/components/SeatBlock";
import DiscardPool from "@/components/DiscardPool";
import ScamCard, { type DisplayMode } from "@/components/ScamCard";
import Tile from "@/components/Tile";
import { SEAT_NAMES } from "@/lib/tiles";
import { decomposeWin } from "@/lib/rules";
import { downloadCertsPdf } from "@/lib/cert";
import { buildViaRecords, todayLabel, type ViaRecord } from "@/lib/via";
import type { Lesson } from "@/lib/education";
import type { GameState, Meld, ServerMessage, TableSummaryRow } from "@/lib/types";
import { btnGold, btnGhost, cn } from "@/lib/ui";

// Which screen edge each seat sits at (seat 0 East / 1 South / 2 West / 3 North).
const SEAT_DIR: Record<number, "top" | "bottom" | "left" | "right"> = { 0: "right", 1: "bottom", 2: "left", 3: "top" };
const DIR_ANIM = { top: "animate-claim-top", bottom: "animate-claim-bottom", left: "animate-claim-left", right: "animate-claim-right" };

interface ClaimBurst {
  id: number;
  seat: number;
  claimType: string;
  tiles: string[];
}

// End-of-game headline stats (brief §6).
const HEADLINE = [
  { big: "$913.1M", small: "total scam losses in 2025" },
  { big: "81.8%", small: "were self-effected transfers" },
  { big: "$37,053", small: "avg loss for seniors 65+ (≈8× youth)" },
];

export default function IPadView() {
  const { roomCode, variant: rawVariant } = useParams<{ roomCode: string; variant: string }>();
  const variant: "demo" | "prod" = rawVariant === "prod" ? "prod" : "demo";
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [huWinner, setHuWinner] = useState<{ pairName: string; hand: string[]; melds: Meld[] } | null>(null);
  const [gameOver, setGameOver] = useState<{ tableSummary: TableSummaryRow[]; hands: number; hostName: string } | null>(null);
  const [burst, setBurst] = useState<ClaimBurst | null>(null);
  const burstId = useRef(0);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("ipad");

  // Persist the iPad/Projector choice across reloads.
  useEffect(() => {
    const saved = localStorage.getItem("hu-display-mode");
    if (saved === "ipad" || saved === "projector") setDisplayMode(saved);
  }, []);
  const toggleMode = useCallback(() => {
    setDisplayMode((m) => {
      const next = m === "ipad" ? "projector" : "ipad";
      localStorage.setItem("hu-display-mode", next);
      return next;
    });
  }, []);

  const handleMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case "LOBBY_UPDATE":
        setGameState((prev) =>
          prev
            ? { ...prev, seats: msg.seats }
            : { phase: "lobby", seats: msg.seats, discardPile: [], wallCount: 60, handNumber: 0, turnSeat: 0, lastDiscard: null, lastDiscardSeat: null, claimWindow: null },
        );
        break;
      case "GAME_STARTED":
        setHuWinner(null);
        setGameOver(null);
        setLesson(null);
        break;
      case "STATE_UPDATE":
        setGameState({ ...msg });
        break;
      case "CLAIM_RESOLVED":
        burstId.current += 1;
        setBurst({ id: burstId.current, seat: msg.winnerSeat, claimType: msg.claimType, tiles: msg.meld });
        break;
      case "LESSON":
        setLesson(msg.lesson);
        break;
      case "RESUME_GAME":
        setLesson(null);
        break;
      case "HU":
        // Stays up until the host presses Continue (cleared on GAME_STARTED).
        setHuWinner({ pairName: msg.pairName, hand: msg.hand, melds: msg.melds });
        break;
      case "GAME_OVER":
        setGameOver({ tableSummary: msg.tableSummary, hands: msg.hands, hostName: msg.hostName });
        break;
      default:
        break;
    }
  }, []);

  // Connects to /host with the room code in the handshake, so the server replays
  // the current table state on connection (incl. after a refresh/reconnect).
  const { send, reconnecting } = useGameSocket(handleMessage, "host", roomCode, variant);

  // Clear the claim burst once its fly animation has played.
  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(null), 1100);
    return () => clearTimeout(t);
  }, [burst]);

  // ── Session complete → VIA Hours Dashboard ───────────────────────────────────
  if (gameOver) {
    const records = buildViaRecords(gameOver.tableSummary, gameOver.hands);
    const dateLabel = todayLabel();
    const hostName = gameOver.hostName || "Hu Knows Volunteer";
    const totalHours = records.reduce((s, r) => s + r.hours, 0);
    const certFor = (r: ViaRecord) => ({ name: r.name, hours: r.hours, dateLabel, issuedBy: hostName });
    const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "player";
    const downloadAll = () => downloadCertsPdf(records.map(certFor), "hu-knows-via-certificates.pdf");
    const downloadOne = (r: ViaRecord) => downloadCertsPdf([certFor(r)], `via-certificate-${slug(r.name)}.pdf`);

    return (
      <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_center,var(--color-felt-warm)_0%,var(--color-felt)_55%,var(--color-felt-deep)_100%)]">
        <Chrome roomCode={roomCode} info="Session complete" reconnecting={reconnecting} right="" />
        <div className="flex-1 overflow-y-auto px-4 py-6 flex justify-center">
          <div className="w-full max-w-[880px] flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-gold text-[1.7rem] font-black flex items-center gap-2">📜 VIA Hours Dashboard</h1>
                <p className="text-sand text-sm mt-1">
                  Issued by <span className="text-cream font-semibold">{hostName}</span> · {dateLabel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className={cn(btnGhost, "!py-2 !px-4 text-sm")} onClick={() => router.push(`/${variant}`)}>
                  + New session
                </button>
                {records.length > 0 && (
                  <button className={cn(btnGold, "!py-2.5 !px-4 text-sm")} onClick={downloadAll}>
                    ⬇️ Download all (PDF)
                  </button>
                )}
              </div>
            </div>

            {/* Summary chips */}
            <div className="grid grid-cols-3 gap-3">
              <Stat big={`${records.length}`} small={`participant${records.length === 1 ? "" : "s"}`} />
              <Stat big={`${totalHours}h`} small="VIA hours awarded" />
              <Stat big={`${gameOver.hands}`} small={`hand${gameOver.hands === 1 ? "" : "s"} played`} />
            </div>

            {/* The VIA records table — one downloadable certificate per player */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-[1.6fr_0.8fr_0.6fr_0.8fr_auto] gap-2 px-4 py-2.5 text-[0.7rem] uppercase tracking-wide text-sand bg-black/30">
                <span>Player</span>
                <span>Seat</span>
                <span>Wins</span>
                <span>VIA hours</span>
                <span className="text-right">Certificate</span>
              </div>
              {records.length === 0 && (
                <div className="px-4 py-8 text-center text-sand/60">No human players in this session.</div>
              )}
              {records.map((r) => (
                <div
                  key={r.seat}
                  className="grid grid-cols-[1.6fr_0.8fr_0.6fr_0.8fr_auto] gap-2 items-center px-4 py-3 border-t border-white/5 text-sm"
                >
                  <span className="text-cream font-semibold truncate">{r.name}</span>
                  <span className="text-sand">{SEAT_NAMES[r.seat]}</span>
                  <span className="text-sand">{r.wins}</span>
                  <span className="text-gold font-bold">{r.hours}h</span>
                  <span className="flex justify-end">
                    <button onClick={() => downloadOne(r)} className={cn(btnGold, "!py-1.5 !px-3 !text-[0.75rem]")}>
                      ⬇️ PDF
                    </button>
                  </span>
                </div>
              ))}
            </div>

            <p className="text-sand text-center text-sm">
              Each player can also download their own certificate on their phone. Every tile taught a scam defence — call{" "}
              <strong className="text-gold">1799</strong> (ScamShield Helpline, 24/7) if you suspect a scam.
            </p>

            {/* Educational headline stats */}
            <div className="grid grid-cols-3 gap-3">
              {HEADLINE.map((h) => (
                <div key={h.big} className="bg-black/30 border border-[rgba(251,191,36,0.2)] rounded-xl px-4 py-3 text-center">
                  <div className="text-gold text-xl font-black">{h.big}</div>
                  <div className="text-sand text-[0.75rem] leading-tight mt-1">{h.small}</div>
                </div>
              ))}
            </div>

            <p className="text-[0.7rem] text-sand/40 text-center pb-2">
              Demo mode — certificates are generated on-device from the names players entered. In the full version, hosts sign in
              and VIA hours are tracked per volunteer.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const seats = gameState?.seats || [];
  const getSeat = (n: number) => seats.find((s) => s.seat === n) || { seat: n, pairName: null, handCount: 0, melds: [], isBot: false };
  const north = getSeat(3);
  const south = getSeat(1);
  const east = getSeat(0);
  const west = getSeat(2);
  const isPlaying = !!gameState && gameState.phase !== "idle" && gameState.phase !== "lobby";
  const winDecomp = huWinner ? decomposeWin(huWinner.hand, huWinner.melds.length) : null;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[radial-gradient(ellipse_at_center,var(--color-felt-warm)_0%,var(--color-felt)_55%,var(--color-felt-deep)_100%)]">
      <Chrome
        roomCode={roomCode}
        info={gameState?.handNumber ? `Hand ${gameState.handNumber}` : ""}
        reconnecting={reconnecting}
        right={isPlaying ? `⬛ ${gameState!.wallCount} tiles left` : "Waiting for players…"}
        toggle={
          <span className="flex items-center gap-2">
            {variant === "demo" && isPlaying && (
              <button
                onClick={() => {
                  if (confirm("End the session now and generate VIA certificates?")) {
                    send({ type: "END_GAME" });
                  }
                }}
                title="Stop the looping demo games and show certificates"
                className="rounded-full border border-[rgba(220,80,70,0.5)] bg-[rgba(220,80,70,0.12)] text-[#f3b6b0] hover:text-cream hover:border-[#dc5046] px-3 py-1 text-[0.75rem] font-semibold transition-colors cursor-pointer"
              >
                ⏹ End game
              </button>
            )}
            <button
              onClick={toggleMode}
              title="Switch how the scam lesson is shown"
              className="rounded-full border border-[rgba(251,191,36,0.4)] text-sand hover:text-cream hover:border-gold px-3 py-1 text-[0.75rem] font-semibold transition-colors cursor-pointer"
            >
              {displayMode === "ipad" ? "🀄 iPad mode" : "📽️ Projector mode"}
            </button>
          </span>
        }
      />

      {huWinner && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 z-[200] animate-fade-in px-4">
          <div className="text-[4.5rem] font-black text-gold drop-shadow-[0_0_40px_rgba(251,191,36,0.6)] animate-hu-bounce">胡!</div>
          <div className="text-2xl text-cream mt-1 font-bold">{huWinner.pairName} wins!</div>
          <div className="text-sand text-sm mt-1">Winning hand — 3 sets + a pair</div>
          <div className="mt-5 flex gap-3 flex-wrap justify-center items-end max-w-[94vw]">
            {huWinner.melds.map((m, i) => (
              <WinGroup key={`claimed-${i}`} label="Claimed" delay={i}>
                {m.tiles.map((t, j) => <Tile key={j} tileId={t} size="m" />)}
              </WinGroup>
            ))}
            {winDecomp?.sets.map((m, i) => (
              <WinGroup key={`set-${i}`} label={m.type === "pung" ? "Pung" : "Chi"} delay={huWinner.melds.length + i}>
                {m.tiles.map((t, j) => <Tile key={j} tileId={t} size="m" />)}
              </WinGroup>
            ))}
            {winDecomp && (
              <WinGroup label="Pair" gold delay={huWinner.melds.length + winDecomp.sets.length}>
                {winDecomp.pair.map((t, j) => <Tile key={j} tileId={t} size="m" />)}
              </WinGroup>
            )}
            {!winDecomp &&
              huWinner.hand.map((t, i) => (
                <div key={i} className="animate-pop-in" style={{ animationDelay: `${i * 55}ms` }}>
                  <Tile tileId={t} size="m" />
                </div>
              ))}
          </div>
          <button className={cn(btnGold, "mt-7")} onClick={() => send({ type: "RESUME" })}>Continue ▶</button>
        </div>
      )}

      {/* Draw (no winner): host continues to the next hand. */}
      {!huWinner && gameState?.phase === "hand_over" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 z-[200] animate-fade-in px-4">
          <div className="text-[3rem]">🀫</div>
          <div className="text-2xl text-cream font-bold">Draw — no winner this hand</div>
          <button className={cn(btnGold, "mt-3")} onClick={() => send({ type: "RESUME" })}>Continue ▶</button>
        </div>
      )}

      {lesson && <ScamCard lesson={lesson} mode={displayMode} onOverride={() => send({ type: "RESUME" })} />}

      {/* Pung/Chi burst — flies toward the claimer's seat (relative to the iPad). */}
      {burst && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center pointer-events-none">
          <div key={burst.id} className={cn("flex flex-col items-center gap-2", DIR_ANIM[SEAT_DIR[burst.seat]])}>
            <div
              className={cn(
                "px-5 py-1.5 rounded-full text-2xl font-black tracking-wide shadow-[0_4px_20px_rgba(0,0,0,0.45)]",
                burst.claimType === "PUNG" ? "bg-scam-red text-white" : "bg-gold text-ink",
              )}
            >
              {burst.claimType}!
            </div>
            <div className="flex gap-1">
              {burst.tiles.map((t, i) => (
                <Tile key={i} tileId={t} size="m" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div
        className="flex-1 relative grid gap-3 p-3"
        style={{
          gridTemplateAreas: '". north ." "west center east" ". south ."',
          gridTemplateColumns: "minmax(210px,24vw) 1fr minmax(210px,24vw)",
          gridTemplateRows: "minmax(170px,23vh) 1fr minmax(170px,23vh)",
        }}
      >
        <div className="flex justify-center items-start" style={{ gridArea: "north" }}>
          <div className="rotate-180">
            <SeatBlock {...north} size="m" isActive={gameState?.turnSeat === north.seat} />
          </div>
        </div>
        <div className="flex justify-end items-center" style={{ gridArea: "west" }}>
          <div className="rotate-90">
            <SeatBlock {...west} size="m" isActive={gameState?.turnSeat === west.seat} />
          </div>
        </div>
        <div className="relative overflow-hidden" style={{ gridArea: "center" }}>
          {isPlaying ? (
            <DiscardPool discardPile={gameState?.discardPile} lastDiscard={gameState?.lastDiscard} size="l" maxVisible={24} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className="text-[4rem]">🀄</div>
              <p className="text-sand text-lg">
                {seats.length === 0 ? "No players yet — share the room code" : `${seats.length}/4 players joined`}
              </p>
              {seats.map((s) => (
                <span key={s.seat} className="text-cream text-base">{SEAT_NAMES[s.seat]} · {s.pairName}{s.isBot ? " 🤖" : ""}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-start items-center" style={{ gridArea: "east" }}>
          <div className="-rotate-90">
            <SeatBlock {...east} size="m" isActive={gameState?.turnSeat === east.seat} />
          </div>
        </div>
        <div className="flex justify-center items-end" style={{ gridArea: "south" }}>
          <SeatBlock {...south} size="m" isActive={gameState?.turnSeat === south.seat} />
        </div>
      </div>

      {isPlaying && gameState?.turnSeat !== undefined && (
        <div className="bg-black/40 border-t border-[rgba(251,191,36,0.15)] px-4 py-1 flex justify-center text-[0.8rem] text-sand">
          <span>
            <span className="text-gold font-bold">{SEAT_NAMES[gameState.turnSeat]} {getSeat(gameState.turnSeat).pairName}</span>
            {gameState.phase === "claim_window" ? "'s discard — claim window open" : "'s turn"}
          </span>
        </div>
      )}
    </div>
  );
}

// A summary chip on the VIA dashboard (a big number over a small caption).
function Stat({ big, small }: { big: string; small: string }) {
  return (
    <div className="bg-white/[0.04] border border-[rgba(251,191,36,0.18)] rounded-2xl px-4 py-3 text-center">
      <div className="text-gold text-2xl font-black">{big}</div>
      <div className="text-sand text-[0.75rem] uppercase tracking-wide mt-0.5">{small}</div>
    </div>
  );
}

// One separated, highlighted group in the winning hand (a set, or the pair).
function WinGroup({ label, children, delay = 0, gold }: { label: string; children: React.ReactNode; delay?: number; gold?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 animate-pop-in" style={{ animationDelay: `${delay * 130}ms` }}>
      <span className={cn("text-[0.7rem] uppercase tracking-wide font-bold", gold ? "text-gold" : "text-sand")}>{label}</span>
      <div
        className={cn(
          "flex gap-0.5 p-2 rounded-xl border-2",
          gold ? "border-gold bg-gold/15 shadow-[0_0_18px_rgba(251,191,36,0.35)]" : "border-[rgba(251,191,36,0.4)] bg-black/40",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function Chrome({
  roomCode,
  info,
  reconnecting,
  right,
  toggle,
}: {
  roomCode: string;
  info: string;
  reconnecting: boolean;
  right: string;
  toggle?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-2 bg-black/35 border-b border-[rgba(251,191,36,0.12)] shrink-0">
      <span className="text-[1.1rem] font-black text-gold shrink-0">胡 Hu Knows or Don&apos;t Know</span>
      <span className="text-[0.85rem] text-sand truncate">
        Room <strong className="text-gold tracking-[2px]">{roomCode}</strong>
        {info ? ` · ${info}` : ""}
        {reconnecting && <span className="text-[#f87171] ml-2">● Reconnecting…</span>}
      </span>
      <span className="flex items-center gap-3 shrink-0">
        {toggle}
        <span className="text-[0.85rem] text-cream font-bold">{right}</span>
      </span>
    </div>
  );
}
