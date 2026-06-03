// ─── In-browser mock of the game server ───────────────────────────────────────
// Ports the original Node room-manager + engine into the browser. Tabs talk over
// a BroadcastChannel; the tab that creates a room HOSTS its engine (mirroring the
// original "iPad is the table" model). Swap this out for the real Socket.IO
// game-service later — the GameClient transport is the only seam that changes.
import { GameEngine, type EngineSeat } from "./engine";
import { botClaim, botTurn } from "./bot";
import type { ClientMessage, ServerMessage, SeatInfo } from "../types";

const CHANNEL = "hu-knows-mock";

type Envelope =
  | { kind: "to-server"; from: string; msg: ClientMessage }
  | { kind: "to-client"; to: string; msg: ServerMessage }
  | { kind: "disconnect"; from: string };

// ── Bus: same-tab fan-out + cross-tab BroadcastChannel ────────────────────────
class Bus {
  private bc: BroadcastChannel | null = null;
  private local = new Set<(env: Envelope) => void>();

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.bc = new BroadcastChannel(CHANNEL);
      this.bc.onmessage = (e: MessageEvent<Envelope>) => this.emitLocal(e.data);
    }
  }

  /** Deliver to subscribers in this tab AND broadcast to other tabs. */
  post(env: Envelope): void {
    this.emitLocal(env);
    this.bc?.postMessage(env);
  }

  subscribe(fn: (env: Envelope) => void): () => void {
    this.local.add(fn);
    return () => this.local.delete(fn);
  }

  private emitLocal(env: Envelope): void {
    for (const fn of this.local) fn(env);
  }
}

// ── Room: ported from rooms.js, addressing clients by id ──────────────────────
interface ServerSeat extends SeatInfo {
  connected: boolean;
  isBot: boolean;
}

class Room {
  code: string;
  ipadClientId: string | null = null;
  phoneClientBySeat: Record<number, string> = {};
  seats: ServerSeat[] = [];
  engine: GameEngine | null = null;
  started = false;
  ipadDeleteTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    code: string,
    private send: (clientId: string, msg: ServerMessage) => void,
  ) {
    this.code = code;
  }

  broadcastAll(msg: ServerMessage): void {
    if (this.ipadClientId) this.send(this.ipadClientId, msg);
    for (const id of Object.values(this.phoneClientBySeat)) this.send(id, msg);
  }

  private sendToSeat(seat: number, msg: ServerMessage): void {
    const id = this.phoneClientBySeat[seat];
    if (id) this.send(id, msg);
  }

  broadcastLobby(): void {
    this.broadcastAll({
      type: "LOBBY_UPDATE",
      seats: this.seats.map((s) => ({ ...s })),
    });
  }

  broadcastState(): void {
    if (!this.engine) return;
    this.broadcastAll({ type: "STATE_UPDATE", ...this.engine.getState() });
  }

  addBot(seat: number): void {
    if (this.seats.find((s) => s.seat === seat)) return;
    this.seats.push({ seat, pairName: `Bot ${seat}`, connected: true, isBot: true });
    this.seats.sort((a, b) => a.seat - b.seat);
    this.broadcastLobby();
  }

  startGame(): { ok?: true; error?: string } {
    if (this.seats.length < 4) return { error: "Need 4 seats" };
    if (this.started) return { error: "Already started" };
    this.started = true;

    const engineSeats: EngineSeat[] = this.seats.map((s) => ({ seat: s.seat, pairName: s.pairName, isBot: s.isBot }));
    const engine = new GameEngine(engineSeats);
    this.engine = engine;

    engine.on("hand_started", ({ dealerSeat, handNumber, hands }) => {
      this.broadcastAll({ type: "GAME_STARTED", dealerSeat, handNumber });
      for (const s of this.seats) {
        if (!s.isBot) this.sendToSeat(s.seat, { type: "DEAL", hand: hands[s.seat] });
      }
      this.broadcastState();
    });

    engine.on("your_turn", ({ seat, hand, drawnTile, canWin, mustDiscard, legalClaims }) => {
      const seatInfo = this.seats.find((s) => s.seat === seat);
      if (seatInfo?.isBot) {
        setTimeout(() => {
          if (engine.phase !== "playing" || engine.turnSeat !== seat) return;
          const result = botTurn({ seat, hand, drawnTile, canWin, legalClaims });
          if (result.action === "HU") engine.declareHu(seat);
          else engine.discard(seat, result.tile);
        }, 800 + Math.random() * 600);
      } else {
        this.sendToSeat(seat, { type: "YOUR_TURN", hand, drawnTile, canWin, mustDiscard, legalClaims });
      }
      this.broadcastState();
    });

    engine.on("claim_window_open", (data) => {
      this.broadcastAll({ type: "CLAIM_WINDOW_OPEN", ...data });
      this.broadcastState();

      for (const s of this.seats) {
        if (!s.isBot) continue;
        const myLegal = data.legalBySeat[s.seat];
        if (!myLegal || myLegal.length === 0) {
          setTimeout(() => engine.submitClaim(s.seat, null, []), 300 + Math.random() * 400);
          continue;
        }
        setTimeout(() => {
          if (engine.phase !== "claim_window") return;
          const chosen = botClaim({ seat: s.seat, legalClaims: myLegal, hand: engine.hands[s.seat] });
          engine.submitClaim(s.seat, chosen ? chosen.type : null, chosen ? chosen.tiles : []);
        }, 300 + Math.random() * 1200);
      }
    });

    engine.on("claim_resolved", (data) => {
      this.broadcastAll({ type: "CLAIM_RESOLVED", ...data });
      if (data.dna) this.broadcastAll({ type: "SCAM_CARD", ...data.dna });
      this.broadcastState();
    });

    engine.on("hu", (data) => {
      this.broadcastAll({ type: "HU", ...data });
      this.broadcastState();
    });

    engine.on("draw", (data) => this.broadcastAll({ type: "DRAW", ...data }));
    engine.on("game_over", (data) => this.broadcastAll({ type: "GAME_OVER", ...data }));

    engine.startHand();
    return { ok: true };
  }

  handle(fromClientId: string, msg: ClientMessage): void {
    const isIpad = fromClientId === this.ipadClientId;
    const seatEntry = Object.entries(this.phoneClientBySeat).find(([, id]) => id === fromClientId);
    const seat = seatEntry ? Number(seatEntry[0]) : null;

    switch (msg.type) {
      case "ADD_BOT":
        if (!isIpad) return this.send(fromClientId, { type: "ERROR", message: "iPad only" });
        this.addBot(msg.seat);
        break;
      case "START_GAME": {
        if (!isIpad) return this.send(fromClientId, { type: "ERROR", message: "iPad only" });
        for (let i = 0; i < 4; i++) if (!this.seats.find((s) => s.seat === i)) this.addBot(i);
        const result = this.startGame();
        if (result.error) this.send(fromClientId, { type: "ERROR", message: result.error });
        break;
      }
      case "DISCARD": {
        if (seat === null) return this.send(fromClientId, { type: "ERROR", message: "No seat assigned" });
        const r = this.engine?.discard(seat, msg.tile);
        if (r?.error) this.send(fromClientId, { type: "ERROR", message: r.error });
        break;
      }
      case "CLAIM": {
        if (seat === null) return this.send(fromClientId, { type: "ERROR", message: "No seat assigned" });
        const r = this.engine?.submitClaim(seat, msg.claimType, msg.tiles || []);
        if (r?.error) this.send(fromClientId, { type: "ERROR", message: r.error });
        break;
      }
      default:
        break;
    }
  }
}

// ── Mock server: owns the rooms created in this tab ───────────────────────────
class MockServer {
  private rooms = new Map<string, Room>();
  private clientRoom = new Map<string, string>();

  constructor(private bus: Bus) {
    bus.subscribe((env) => {
      if (env.kind === "to-server") this.handle(env.from, env.msg);
      else if (env.kind === "disconnect") this.removeClient(env.from);
    });
  }

  private send = (clientId: string, msg: ServerMessage): void => {
    this.bus.post({ kind: "to-client", to: clientId, msg });
  };

  private generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    do {
      code = "";
      for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    } while (this.rooms.has(code));
    return code;
  }

  private handle(from: string, msg: ClientMessage): void {
    switch (msg.type) {
      case "CREATE_ROOM": {
        const code = this.generateCode();
        const room = new Room(code, this.send);
        room.ipadClientId = from;
        this.rooms.set(code, room);
        this.clientRoom.set(from, code);
        this.send(from, { type: "ROOM_CREATED", roomCode: code });
        room.broadcastLobby();
        break;
      }
      case "REJOIN_IPAD": {
        const room = this.rooms.get(msg.roomCode);
        if (!room) return; // another tab owns it (or it's gone)
        if (room.ipadDeleteTimer) {
          clearTimeout(room.ipadDeleteTimer);
          room.ipadDeleteTimer = null;
        }
        room.ipadClientId = from;
        this.clientRoom.set(from, msg.roomCode);
        room.broadcastLobby();
        if (room.engine) this.send(from, { type: "STATE_UPDATE", ...room.engine.getState() });
        break;
      }
      case "JOIN_ROOM": {
        const room = this.rooms.get(msg.roomCode);
        if (!room) return; // owner tab will answer; if none exists, no-op
        this.joinRoom(room, from, msg.pairName || "Anonymous");
        break;
      }
      default: {
        const code = this.clientRoom.get(from);
        const room = code ? this.rooms.get(code) : undefined;
        if (room) room.handle(from, msg);
      }
    }
  }

  private joinRoom(room: Room, clientId: string, pairName: string): void {
    // Reclaim an existing seat by pair name (reconnect / refresh / navigation).
    const existing = room.seats.find((s) => !s.isBot && s.pairName === pairName);
    if (existing) {
      existing.connected = true;
      room.phoneClientBySeat[existing.seat] = clientId;
      this.clientRoom.set(clientId, room.code);
      this.send(clientId, { type: "SEAT_ASSIGNED", seat: existing.seat, pairName });
      room.broadcastLobby();
      if (room.engine) {
        this.send(clientId, { type: "STATE_UPDATE", ...room.engine.getState() });
        this.send(clientId, { type: "DEAL", hand: room.engine.hands[existing.seat] ?? [] });
      }
      return;
    }

    if (room.started) {
      this.send(clientId, { type: "ERROR", message: "Game already started" });
      return;
    }

    const taken = room.seats.map((s) => s.seat);
    let seat: number | null = null;
    for (let i = 0; i < 4; i++) {
      if (!taken.includes(i)) {
        seat = i;
        break;
      }
    }
    if (seat === null) {
      this.send(clientId, { type: "ERROR", message: "Room full" });
      return;
    }

    room.seats.push({ seat, pairName, connected: true, isBot: false });
    room.seats.sort((a, b) => a.seat - b.seat);
    room.phoneClientBySeat[seat] = clientId;
    this.clientRoom.set(clientId, room.code);
    this.send(clientId, { type: "SEAT_ASSIGNED", seat, pairName });
    room.broadcastLobby();
  }

  private removeClient(clientId: string): void {
    const code = this.clientRoom.get(clientId);
    this.clientRoom.delete(clientId);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room) return;

    if (room.ipadClientId === clientId) {
      // Grace period so navigation/refresh can re-claim the table.
      room.ipadClientId = null;
      if (room.ipadDeleteTimer) clearTimeout(room.ipadDeleteTimer);
      room.ipadDeleteTimer = setTimeout(() => this.rooms.delete(code), 30000);
      return;
    }
    for (const [seat, id] of Object.entries(room.phoneClientBySeat)) {
      if (id === clientId) {
        const s = room.seats.find((x) => x.seat === Number(seat));
        if (s) s.connected = false;
        delete room.phoneClientBySeat[Number(seat)];
        room.broadcastLobby();
        return;
      }
    }
  }
}

// ── Per-tab singletons ────────────────────────────────────────────────────────
let bus: Bus | null = null;

export function getMockBus(): Bus {
  if (!bus) {
    bus = new Bus();
    new MockServer(bus); // server lives as long as the tab does
  }
  return bus;
}

export type { Envelope };
