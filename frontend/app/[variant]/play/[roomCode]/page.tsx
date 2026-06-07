"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameSocket } from "@/lib/useGameSocket";
import { getClientName, setClientName } from "@/lib/net/clientIdentity";
import TileRack from "@/components/TileRack";
import MeldGroup from "@/components/MeldGroup";
import ActionZone from "@/components/ActionZone";
import Tile from "@/components/Tile";
import { SEAT_NAMES } from "@/lib/tiles";
import type { Claim, ClaimType, ClaimWindowState, GameState, Meld, ServerMessage, TableSummaryRow } from "@/lib/types";
import { btnGold, cn, feltRadial } from "@/lib/ui";

type Banner = { text: string; type: "info" | "gold" | "green" | "red" } | null;

// Defined at module scope so they keep a stable identity across renders
// (inline components would remount their subtree and steal input focus).
function Shell({ children }: { children: React.ReactNode }) {
  return <div className={cn("min-h-[100dvh] flex flex-col", feltRadial)}>{children}</div>;
}
function Header({ right }: { right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-black/30 border-b border-[rgba(251,191,36,0.1)]">
      <span className="text-base font-black text-gold">胡 Hu Knows</span>
      <span className="text-[0.8rem] text-sand">{right}</span>
    </div>
  );
}

export default function PhoneView() {
  const { roomCode, variant: rawVariant } = useParams<{ roomCode: string; variant: string }>();
  const variant: "demo" | "prod" = rawVariant === "prod" ? "prod" : "demo";
  const router = useRouter();

  const [joined, setJoined] = useState(false);
  const [mySeat, setMySeat] = useState<number | null>(null);
  const [pairName, setPairName] = useState("");
  const [nameInput, setNameInput] = useState("");

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myHand, setMyHand] = useState<string[]>([]);
  const [myMelds, setMyMelds] = useState<Meld[]>([]);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [canWin, setCanWin] = useState(false);
  const [mustDiscard, setMustDiscard] = useState(false);
  const [legalClaims, setLegalClaims] = useState<Claim[]>([]);
  const [claimWindow, setClaimWindow] = useState<ClaimWindowState | null>(null);
  const [banner, setBanner] = useState<Banner>(null);
  const [huWinner, setHuWinner] = useState<{ pairName: string } | null>(null);
  const [gameOver, setGameOver] = useState<{ tableSummary: TableSummaryRow[] } | null>(null);

  const mySeatRef = useRef<number | null>(null);
  useEffect(() => {
    mySeatRef.current = mySeat;
  }, [mySeat]);

  const handleMessage = useCallback((msg: ServerMessage) => {
    const seat = mySeatRef.current;
    switch (msg.type) {
      case "SEAT_ASSIGNED":
        setMySeat(msg.seat);
        setPairName(msg.pairName || "");
        setJoined(true);
        break;
      case "GAME_STARTED":
        setHuWinner(null);
        setGameOver(null);
        setClaimWindow(null);
        setBanner({ text: `Hand ${msg.handNumber} begins!`, type: "info" });
        setTimeout(() => setBanner(null), 2500);
        break;
      case "DEAL":
        setMyHand(msg.hand);
        setMyMelds([]);
        setSelectedTile(null);
        break;
      case "STATE_UPDATE":
        setGameState({ ...msg });
        setClaimWindow(msg.claimWindow || null);
        if (seat !== null && msg.seats) {
          const me = msg.seats.find((s) => s.seat === seat);
          if (me) setMyMelds(me.melds || []);
        }
        break;
      case "YOUR_TURN":
        setMyHand(msg.hand);
        setIsMyTurn(true);
        setCanWin(msg.canWin);
        setMustDiscard(msg.mustDiscard);
        setLegalClaims(msg.legalClaims || []);
        setSelectedTile(null);
        setBanner(msg.canWin ? { text: "You can win! Press 胡 HU!", type: "gold" } : { text: "Your turn — tap a tile to discard", type: "info" });
        break;
      case "CLAIM_WINDOW_OPEN": {
        setClaimWindow({ bySeat: msg.bySeat, closesAt: msg.closesAt, legalBySeat: msg.legalBySeat });
        setIsMyTurn(false);
        const myLegal = (seat !== null && msg.legalBySeat?.[seat]) || [];
        if (myLegal.length > 0) setBanner({ text: `Claim available: ${myLegal.map((c) => c.type).join(" / ")}`, type: "gold" });
        else setBanner(null);
        break;
      }
      case "CLAIM_RESOLVED":
        setClaimWindow(null);
        setIsMyTurn(false);
        if (msg.winnerSeat === seat) {
          setMyMelds((prev) => [...prev, { type: msg.claimType.toLowerCase() as Meld["type"], tiles: msg.meld }]);
          setBanner({ text: `${msg.claimType} claimed! Now discard a tile.`, type: "green" });
        }
        break;
      case "HU":
        setHuWinner({ pairName: msg.pairName });
        setIsMyTurn(false);
        setClaimWindow(null);
        setBanner(msg.winnerSeat === seat ? { text: "🎉 You win this hand!", type: "gold" } : { text: `${msg.pairName} wins!`, type: "info" });
        break;
      case "DRAW":
        setBanner({ text: "Draw — wall exhausted", type: "info" });
        setIsMyTurn(false);
        setClaimWindow(null);
        break;
      case "GAME_OVER":
        setGameOver({ tableSummary: msg.tableSummary });
        setIsMyTurn(false);
        setClaimWindow(null);
        break;
      case "LESSON":
        setBanner({ text: "📖 Scam lesson on the table — look up! Resumes when the host continues.", type: "gold" });
        break;
      case "RESUME_GAME":
        setBanner(null);
        break;
      case "ERROR":
        setBanner({ text: `Error: ${msg.message}`, type: "red" });
        setTimeout(() => setBanner(null), 3000);
        break;
      default:
        break;
    }
  }, []);

  // Connects to /play with the room code in the handshake, so the server replays
  // the current state on connection. A returning player's seat + hand are
  // reclaimed automatically (by clientId) and SEAT_ASSIGNED marks them joined; a
  // first-time player just sees the current board and takes a seat via the form.
  const { send, connected } = useGameSocket(handleMessage, "player", roomCode, variant);

  // Prefill the name field from the saved client name for the first-time join.
  useEffect(() => {
    const saved = getClientName();
    if (saved) {
      setNameInput(saved);
      setPairName(saved);
    }
  }, []);

  const doJoin = () => {
    const name = nameInput.trim() || "Anonymous";
    setClientName(name); // persist the player's name in localStorage for reuse
    send({ type: "JOIN_ROOM", roomCode, pairName: name });
  };

  const handleDiscard = (tile: string) => {
    send({ type: "DISCARD", tile });
    setMyHand((prev) => prev.filter((t) => t !== tile)); // instant feedback — tile leaves the rack now
    setSelectedTile(null);
    setIsMyTurn(false);
    setBanner({ text: "Tile thrown ✓", type: "green" });
  };
  const handleHu = () => {
    send({ type: "CLAIM", claimType: "HU", tiles: [] });
    setIsMyTurn(false);
    setBanner(null);
  };
  const handleClaim = (claimType: ClaimType, tiles: string[]) => {
    send({ type: "CLAIM", claimType, tiles });
    setClaimWindow(null);
    setBanner(null);
  };
  const handlePass = () => {
    send({ type: "CLAIM", claimType: null, tiles: [] });
    setClaimWindow(null);
    setBanner(null);
  };

  // ── Not joined ────────────────────────────────────────────────────────────
  if (!joined) {
    return (
      <Shell>
        <Header right={<>Room: {roomCode}</>} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="text-center">
            <div className="text-[2rem] mb-2">🎴</div>
            <h2 className="text-cream text-[1.1rem] mb-1">Join Room <strong className="text-gold">{roomCode}</strong></h2>
            <p className="text-sand text-[0.8rem]">Enter your pair name</p>
          </div>
          <input
            className="bg-white/[0.07] border border-[rgba(212,180,131,0.3)] rounded-lg px-3.5 py-2.5 text-cream w-full max-w-[260px] outline-none focus:border-gold"
            placeholder='"Sarah & Mdm Tan"'
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doJoin()}
          />
          {!connected && <p className="text-[#f87171] text-[0.75rem]">Connecting…</p>}
          <button className={cn(btnGold, "w-full max-w-[260px]")} onClick={doJoin} disabled={!connected}>Join →</button>
          <button className="text-sand text-[0.8rem] underline" onClick={() => router.push(`/${variant}`)}>← Back to lobby</button>
        </div>
      </Shell>
    );
  }

  // ── Game over ─────────────────────────────────────────────────────────────
  if (gameOver) {
    const sorted = [...gameOver.tableSummary].sort((a, b) => b.wins - a.wins);
    return (
      <Shell>
        <Header right={pairName} />
        <div className="flex-1 flex flex-col items-center gap-4 pt-8 px-4">
          <div className="text-[3rem]">🏆</div>
          <h2 className="text-gold text-[1.3rem] font-black">Game Over!</h2>
          <div className="w-full max-w-[360px]">
            {sorted.map((row, i) => (
              <div key={row.seat} className={cn("flex justify-between px-3 py-2 rounded-md", i === 0 ? "bg-gold/15 text-gold font-extrabold" : "text-cream")}>
                <span>{SEAT_NAMES[row.seat]} {row.pairName}</span>
                <span>{row.wins} wins {i === 0 ? "🏆" : ""}</span>
              </div>
            ))}
          </div>
          <button className={btnGold} onClick={() => router.push(`/${variant}`)}>Play Again</button>
        </div>
      </Shell>
    );
  }

  // ── Waiting for game start ───────────────────────────────────────────────────
  if (!gameState || gameState.phase === "idle" || gameState.phase === "lobby") {
    return (
      <Shell>
        <Header right={mySeat !== null ? `${pairName} · ${SEAT_NAMES[mySeat]}` : pairName} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="text-[2rem]">🎴</div>
          <h2 className="text-gold text-[1.3rem]">Waiting for game to start</h2>
          {mySeat !== null && <p className="text-sand">Seat: <strong className="text-gold">{SEAT_NAMES[mySeat]}</strong> · {pairName}</p>}
          <div className="w-8 h-8 border-[3px] border-[rgba(251,191,36,0.2)] border-t-gold rounded-full animate-spin-fast" />
          <p className="text-sand text-[0.875rem]">The coordinator will start the game shortly.</p>
        </div>
      </Shell>
    );
  }

  // ── In-game ──────────────────────────────────────────────────────────────────
  return (
    <Shell>
      {/* Thin top bar — identity, the tile you can act on, wall count. Nothing else. */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-black/30 border-b border-[rgba(251,191,36,0.1)] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => router.push(`/${variant}`)} title="Leave" className="text-sand/60 hover:text-cream text-base leading-none shrink-0">
            ✕
          </button>
          <span className="text-sm font-bold text-cream truncate">
            {mySeat !== null ? SEAT_NAMES[mySeat] : ""} · {pairName}
            {gameState.turnSeat === mySeat && <span className="text-gold ml-1">★</span>}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {gameState.lastDiscard && (
            <div className="flex items-center gap-1">
              <span className="text-[0.6rem] text-sand uppercase tracking-wide">last</span>
              <Tile tileId={gameState.lastDiscard} size="s" glow />
            </div>
          )}
          <span className="text-[0.7rem] text-sand">⬛{gameState.wallCount}</span>
        </div>
      </div>

      {banner && (
        <div
          className={cn(
            "px-4 py-1.5 text-[0.8rem] font-semibold border-l-[3px] shrink-0 text-center",
            banner.type === "red"
              ? "bg-[rgba(185,28,28,0.15)] border-scam-red text-[#f87171]"
              : banner.type === "green"
                ? "bg-[rgba(29,158,117,0.15)] border-[#1d9e75] text-[#34d399]"
                : "bg-[rgba(251,191,36,0.12)] border-gold text-gold",
          )}
        >
          {banner.text}
        </div>
      )}

      {huWinner && (
        <div className="bg-black/70 px-4 py-2 text-center shrink-0">
          <span className="text-[1.6rem] text-gold animate-hu-bounce">胡!</span>
          <span className="text-cream text-[0.9rem] ml-2">{huWinner.pairName} wins!</span>
        </div>
      )}

      {/* The hand is the entire focus — one big horizontal row, centred. */}
      <div className="flex-1 flex flex-col justify-center gap-2 px-2 min-h-0">
        {myMelds.length > 0 && (
          <div className="flex gap-1.5 justify-center flex-wrap shrink-0">
            {myMelds.map((m, i) => <MeldGroup key={i} meld={m} size="s" />)}
          </div>
        )}
        {isMyTurn && mustDiscard && (
          <div className="text-center text-gold text-xs font-bold animate-pulse shrink-0">
            {selectedTile ? "tap again (or Discard ▸) to throw" : "your turn — tap a tile to throw"}
          </div>
        )}
        <div
          className={cn(
            "rounded-2xl p-2 transition-all",
            isMyTurn && mustDiscard ? "ring-2 ring-gold/70 bg-gold/5 shadow-[0_0_24px_rgba(251,191,36,0.25)]" : "",
          )}
        >
          <TileRack
            tiles={myHand}
            size="l"
            wrap={false}
            selectedTile={selectedTile}
            onSelect={(t) => {
              if (!isMyTurn || !mustDiscard) return;
              if (selectedTile === t) handleDiscard(t);
              else setSelectedTile(t);
            }}
            disabled={!isMyTurn || canWin}
          />
        </div>
      </div>

      {/* Bottom: actions only. */}
      <div className="px-3 py-2 border-t border-[rgba(251,191,36,0.1)] bg-black/20 shrink-0">
        <ActionZone
          phase={gameState.phase}
          isMyTurn={isMyTurn}
          canWin={canWin}
          mustDiscard={mustDiscard}
          selectedTile={selectedTile}
          claimWindow={claimWindow}
          mySeat={mySeat}
          discardTile={gameState.lastDiscard}
          legalClaims={legalClaims}
          onDiscard={handleDiscard}
          onHu={handleHu}
          onClaim={handleClaim}
          onPass={handlePass}
        />
      </div>
    </Shell>
  );
}
