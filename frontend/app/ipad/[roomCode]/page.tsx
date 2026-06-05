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
import type { Lesson } from "@/lib/education";
import type { GameState, Meld, ServerMessage, TableSummaryRow } from "@/lib/types";
import { btnGold, cn } from "@/lib/ui";

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
  const { roomCode } = useParams<{ roomCode: string }>();
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonUntil, setLessonUntil] = useState(0);
  const [huWinner, setHuWinner] = useState<{ pairName: string; hand: string[]; melds: Meld[] } | null>(null);
  const [gameOver, setGameOver] = useState<{ tableSummary: TableSummaryRow[] } | null>(null);
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
        setLessonUntil(msg.until);
        break;
      case "RESUME_GAME":
        setLesson(null);
        break;
      case "HU":
        setHuWinner({ pairName: msg.pairName, hand: msg.hand, melds: msg.melds });
        setTimeout(() => setHuWinner(null), 9000);
        break;
      case "GAME_OVER":
        setGameOver({ tableSummary: msg.tableSummary });
        break;
      default:
        break;
    }
  }, []);

  const { send, connected } = useGameSocket(handleMessage);

  // Re-claim the table on (re)connect — works for direct /ipad/CODE visits too.
  useEffect(() => {
    if (connected && roomCode) send({ type: "REJOIN_IPAD", roomCode });
  }, [connected, roomCode, send]);

  // Clear the claim burst once its fly animation has played.
  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(null), 1100);
    return () => clearTimeout(t);
  }, [burst]);

  // ── Game over ───────────────────────────────────────────────────────────────
  if (gameOver) {
    const sorted = [...gameOver.tableSummary].sort((a, b) => b.wins - a.wins);
    return (
      <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_center,var(--color-felt-warm)_0%,var(--color-felt)_55%,var(--color-felt-deep)_100%)]">
        <Chrome roomCode={roomCode} info="Game Over" connected={connected} right="" />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="text-[4rem]">🏆</div>
          <h2 className="text-gold text-[2rem] font-black">Final Scores</h2>
          <div className="w-full max-w-[500px]">
            {sorted.map((row, i) => (
              <div key={row.seat} className={cn("flex justify-between px-3 py-2 rounded-md text-[1.1rem]", i === 0 ? "bg-gold/15 text-gold font-extrabold" : "text-cream")}>
                <span>{SEAT_NAMES[row.seat]} {row.pairName}</span>
                <span>{row.wins} wins {i === 0 ? "🏆" : ""}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-4 max-w-[640px]">
            {HEADLINE.map((h) => (
              <div key={h.big} className="bg-black/30 border border-[rgba(251,191,36,0.2)] rounded-xl px-5 py-3 min-w-[160px]">
                <div className="text-gold text-2xl font-black">{h.big}</div>
                <div className="text-sand text-[0.8rem] leading-tight mt-1">{h.small}</div>
              </div>
            ))}
          </div>
          <p className="text-sand mt-3">
            Every tile taught a scam defence. Call <strong className="text-gold">1799</strong> (ScamShield Helpline, 24/7) if you suspect a scam.
          </p>
          <button className={cn(btnGold, "mt-3")} onClick={() => router.push("/")}>New Game</button>
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
        connected={connected}
        right={isPlaying ? `⬛ ${gameState!.wallCount} tiles left` : "Waiting for players…"}
        toggle={
          <button
            onClick={toggleMode}
            title="Switch how the scam lesson is shown"
            className="rounded-full border border-[rgba(251,191,36,0.4)] text-sand hover:text-cream hover:border-gold px-3 py-1 text-[0.75rem] font-semibold transition-colors cursor-pointer"
          >
            {displayMode === "ipad" ? "🀄 iPad mode" : "📽️ Projector mode"}
          </button>
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
        </div>
      )}

      {lesson && <ScamCard lesson={lesson} until={lessonUntil} mode={displayMode} onOverride={() => send({ type: "RESUME" })} />}

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
  connected,
  right,
  toggle,
}: {
  roomCode: string;
  info: string;
  connected: boolean;
  right: string;
  toggle?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-2 bg-black/35 border-b border-[rgba(251,191,36,0.12)] shrink-0">
      <span className="text-[1.1rem] font-black text-gold shrink-0">胡 Hu Knows or Don&apos;t Know</span>
      <span className="text-[0.85rem] text-sand truncate">
        Room <strong className="text-gold tracking-[2px]">{roomCode}</strong>
        {info ? ` · ${info}` : ""}
        {!connected && <span className="text-[#f87171] ml-2">● Reconnecting…</span>}
      </span>
      <span className="flex items-center gap-3 shrink-0">
        {toggle}
        <span className="text-[0.85rem] text-cream font-bold">{right}</span>
      </span>
    </div>
  );
}
