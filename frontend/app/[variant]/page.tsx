"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useGameSocket } from "@/lib/useGameSocket";
import { getClientName, setClientName } from "@/lib/net/clientIdentity";
import { SEAT_NAMES } from "@/lib/tiles";
import type { ClientMessage, ServerMessage, SeatInfo } from "@/lib/types";
import { btnGold, btnGhost, cn, feltRadial, inputField } from "@/lib/ui";

// The lobby connects only once the user picks an operation:
//   host → /host namespace (renders the board), player → /play (phone UI).
type Role = "host" | "player";

export default function Lobby() {
  const router = useRouter();
  // "demo" (in-memory game-service-demo, no login) or "prod" (real backend).
  const { variant: rawVariant } = useParams<{ variant: string }>();
  const variant: "demo" | "prod" = rawVariant === "prod" ? "prod" : "demo";
  const [role, setRole] = useState<Role | null>(null);
  // First message to send once the chosen-namespace connection is live.
  const [pendingAction, setPendingAction] = useState<ClientMessage | null>(null);
  // Room code put in the connection handshake — set when joining an existing room
  // (so the server replays its state); undefined when creating a fresh table.
  const [connRoomCode, setConnRoomCode] = useState<string | undefined>(undefined);
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  // Prefill the pair name from the saved client name (players only).
  const [pairName, setPairName] = useState(getClientName);
  const [seats, setSeats] = useState<SeatInfo[]>([]);
  const [mySeat, setMySeat] = useState<number | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [autoStart, setAutoStart] = useState(false);

  const sendRef = useRef<((m: never) => void) | null>(null);

  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case "ROOM_CREATED": {
          setRoomCode(msg.roomCode);
          const joinUrl = `${window.location.origin}/${variant}/play/${msg.roomCode}`;
          QRCode.toDataURL(joinUrl, { width: 160, margin: 1, color: { dark: "#2a1f15", light: "#ffffff" } })
            .then(setQrDataUrl)
            .catch(console.error);
          break;
        }
        case "LOBBY_UPDATE":
          setSeats(msg.seats || []);
          break;
        case "SEAT_ASSIGNED":
          setMySeat(msg.seat);
          setJoining(false);
          break;
        case "GAME_STARTED":
          if (role === "host") router.push(`/${variant}/host/${roomCode}`);
          else router.push(`/${variant}/play/${roomCode || inputCode.toUpperCase()}`);
          break;
        case "ERROR":
          setError(msg.message);
          setJoining(false);
          break;
        default:
          break;
      }
    },
    [role, roomCode, inputCode, router, variant],
  );

  const { send, connected, reconnecting } = useGameSocket(handleMessage, role, connRoomCode, variant);
  useEffect(() => {
    sendRef.current = send as never;
  }, [send]);

  // Fire the first message once the chosen-namespace connection is live.
  useEffect(() => {
    if (connected && pendingAction) {
      send(pendingAction);
      setPendingAction(null);
    }
  }, [connected, pendingAction, send]);

  const handleCreateRoom = () => {
    setRole("host"); // connects to /host
    setPendingAction({ type: "CREATE_ROOM" });
  };

  const handleJoinRoom = () => {
    const code = inputCode.trim().toUpperCase();
    const name = pairName.trim() || "Anonymous";
    if (code.length !== 4) {
      setError("Enter a 4-character room code");
      return;
    }
    setError("");
    setJoining(true);
    setClientName(name); // persist the player's name in localStorage for reuse
    setConnRoomCode(code); // handshake room code → server replays state on connect
    setRole("player"); // connects to /play
    setPendingAction({ type: "JOIN_ROOM", roomCode: code, pairName: name });
  };

  const handleDemo = () => {
    setRole("host");
    setAutoStart(true);
    setPendingAction({ type: "CREATE_ROOM" });
  };

  // When a demo room is created, fill with bots and start.
  useEffect(() => {
    if (autoStart && roomCode && role === "host") {
      setAutoStart(false);
      const s = send;
      setTimeout(() => [0, 1, 2, 3].forEach((seat) => s({ type: "ADD_BOT", seat })), 200);
      setTimeout(() => s({ type: "START_GAME" }), 600);
    }
  }, [autoStart, roomCode, role, send]);

  // ── Host lobby ──────────────────────────────────────────────────────────────
  if (role === "host" && roomCode) {
    return (
      <div className={cn("min-h-screen flex flex-col items-center justify-center gap-5 p-6", feltRadial)}>
        <div className="text-center">
          <h1 className="text-[2.8rem] font-black text-gold tracking-tight">胡 Hu Knows?</h1>
          <p className="text-sand mt-1">Room created — waiting for players</p>
        </div>

        <div className="text-center">
          <div className="text-[0.85rem] text-sand mb-2">Room code</div>
          <div className="text-[4rem] font-black text-gold tracking-[12px] leading-none">{roomCode}</div>
          {qrDataUrl && (
            <div className="mt-4 bg-white p-3 rounded-xl inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Join QR code" width={160} height={160} />
            </div>
          )}
          <div className="text-[0.8rem] text-sand mt-2">
            Scan or go to <strong className="text-cream">{typeof window !== "undefined" ? window.location.origin : ""}/{variant}/play/{roomCode}</strong>
          </div>
        </div>

        <div className="w-full max-w-[420px] bg-white/[0.04] border border-[rgba(251,191,36,0.2)] rounded-2xl p-7 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-cream text-xl font-bold">Seats ({seats.length}/4)</h2>
            <span className="text-[0.75rem] text-sand flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", connected ? "bg-[#22c55e] shadow-[0_0_6px_#22c55e]" : reconnecting ? "bg-[#ef4444]" : "bg-[#f59e0b]")} />
              {connected ? "Connected" : reconnecting ? "Reconnecting…" : "Connecting…"}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((s) => {
              const filled = seats.find((x) => x.seat === s);
              return (
                <div
                  key={s}
                  className={cn(
                    "flex items-center gap-2.5 bg-white/[0.04] rounded-lg px-3.5 py-2.5 border",
                    filled ? "border-[rgba(251,191,36,0.3)]" : "border-[rgba(251,191,36,0.1)]",
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-gold/15 text-gold flex items-center justify-center text-[0.875rem] font-extrabold shrink-0">
                    {SEAT_NAMES[s]}
                  </div>
                  {filled ? (
                    <>
                      <span className="flex-1 text-[0.9rem] text-cream">{filled.pairName}{filled.isBot ? " 🤖" : ""}</span>
                      <span className="text-[0.75rem] text-sand">{filled.connected ? "●" : "○"}</span>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-[0.9rem] text-cream opacity-40">Empty</span>
                      <button className={cn(btnGhost, "!text-[0.75rem] !px-2.5 !py-1")} onClick={() => send({ type: "ADD_BOT", seat: s })}>
                        + Bot
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <button className={cn(btnGold, seats.length === 0 && "opacity-50")} disabled={seats.length === 0} onClick={() => send({ type: "START_GAME" })}>
            Start Game →
          </button>
          <p className="text-[0.75rem] text-sand text-center">Empty seats are filled with bots automatically.</p>
        </div>
      </div>
    );
  }

  // ── Phone lobby (waiting after join) ────────────────────────────────────────
  if (role === "player" && mySeat !== null) {
    return (
      <div className={cn("min-h-screen flex flex-col items-center justify-center gap-5 p-6", feltRadial)}>
        <div className="text-center">
          <h1 className="text-[2.8rem] font-black text-gold tracking-tight">胡 Hu Knows?</h1>
          <p className="text-sand mt-1">Joined as seat {SEAT_NAMES[mySeat]}</p>
        </div>
        <div className="w-full max-w-[420px] bg-white/[0.04] border border-[rgba(251,191,36,0.2)] rounded-2xl p-7 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gold/15 text-gold flex items-center justify-center text-2xl font-extrabold">
            {SEAT_NAMES[mySeat]}
          </div>
          <p className="text-center text-cream">
            You are <strong>{pairName || "Anonymous"}</strong> — Seat {SEAT_NAMES[mySeat]}
          </p>
          <div className="w-8 h-8 border-[3px] border-[rgba(251,191,36,0.2)] border-t-gold rounded-full animate-spin-fast" />
          <p className="text-sand text-[0.875rem]">Waiting for the coordinator to start…</p>
        </div>
      </div>
    );
  }

  // ── Main lobby ──────────────────────────────────────────────────────────────
  return (
    <div className={cn("min-h-screen flex flex-col items-center justify-center gap-5 p-6", feltRadial)}>
      <div className="text-center">
        <h1 className="text-[2.8rem] font-black text-gold tracking-tight">胡 Hu Knows or Don&apos;t Know</h1>
        <p className="text-sand mt-1">Anti-scam Mahjong · Learn · Play · Protect Singapore</p>
      </div>

      {role !== null && !connected && reconnecting && (
        <div className="bg-[rgba(185,28,28,0.15)] border border-scam-red rounded-lg px-4 py-2 text-[0.85rem] text-[#f87171]">
          Connecting…
        </div>
      )}

      <div className="flex gap-5 flex-wrap justify-center w-full max-w-[760px]">
        <div className="flex-1 min-w-[280px] max-w-[360px] bg-white/[0.04] border border-[rgba(251,191,36,0.2)] rounded-2xl p-7 flex flex-col gap-4">
          <h2 className="text-cream text-xl font-bold">📱 Create Table</h2>
          <p className="text-sand text-[0.875rem] leading-relaxed">Set up the shared display. Place this device at the centre of the table.</p>
          <button className={btnGold} onClick={handleCreateRoom} disabled={role !== null}>Create Table</button>
        </div>

        <div className="flex-1 min-w-[280px] max-w-[360px] bg-white/[0.04] border border-[rgba(251,191,36,0.2)] rounded-2xl p-7 flex flex-col gap-4">
          <h2 className="text-cream text-xl font-bold">🎴 Join Game</h2>
          <p className="text-sand text-[0.875rem] leading-relaxed">Enter the 4-character room code shown on the shared display.</p>
          <input
            className={cn(inputField, "text-[1.6rem] font-extrabold tracking-[8px] text-center uppercase")}
            placeholder="ABCD"
            maxLength={4}
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
          />
          <input
            className={inputField}
            placeholder='Pair name, e.g. "Sarah & Mdm Tan"'
            value={pairName}
            onChange={(e) => setPairName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
          />
          {error && <p className="text-[#f87171] text-[0.85rem]">{error}</p>}
          <button className={btnGold} onClick={handleJoinRoom} disabled={joining}>
            {joining ? "Joining…" : "Join Game →"}
          </button>
        </div>
      </div>

      <button className="bg-none border-none text-[rgba(212,180,131,0.5)] text-[0.8rem] cursor-pointer underline hover:text-sand" onClick={handleDemo} disabled={role !== null}>
        ▶ Demo mode — instant 4-bot game
      </button>

      <p className="text-[0.75rem] text-[rgba(212,180,131,0.35)] max-w-[400px] text-center">
        CODE_EXP 2026 · Built for Singapore · Every tile teaches scam defence
      </p>
    </div>
  );
}
