// ─── Room manager + dispatcher (ported from frontend/lib/mock/mockServer.ts) ──
// The single brain: owns every room, holds full state, validates every action,
// runs the 4-second claim window, resolves priority, and broadcasts to clients.
// Host and player sockets live on two different Socket.IO namespaces but share
// this one service instance. See GAME_MECHANIC_BRIEF.md §5,7.
//
// State is persisted to Redis (write-through) and rehydrated on demand, so a
// restart does not lose active sessions. Live sockets and the engine's in-memory
// timers stay process-local; clients re-establish sockets on reconnect.
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Socket } from 'socket.io';

import { RedisService } from '../redis/redis.service';
import { ViaLogClient } from '../via-log-client/via-log.client';
import { botClaim, botTurn } from './engine/bot';
import { buildLesson } from './engine/education';
import { GameEngine, type EngineSeat, type EngineSnapshot } from './engine/engine';
import {
  HOST_MESSAGE_TYPES,
  PLAYER_MESSAGE_TYPES,
  type ClientMessage,
  type ServerMessage,
  type SeatInfo,
} from './engine/protocol';

export type ClientRole = 'host' | 'player';

type SessionStatus = 'lobby' | 'active' | 'ended';

interface ServerSeat extends SeatInfo {
  connected: boolean;
  isBot: boolean;
  // Stable client id (from localStorage) of the phone owning this seat — used to
  // reclaim the seat on reconnect. Persisted; null for bots.
  clientId: string | null;
  // Supabase user id of the volunteer in this seat (from the JWT) — used to
  // credit VIA minutes when the game ends. Persisted; null for bots.
  supabaseUserId: string | null;
}

/** JSON-serializable room snapshot stored in Redis. */
interface RoomSnapshot {
  code: string;
  sessionId: string;
  status: SessionStatus;
  started: boolean;
  startedAt: number | null;
  hostName: string;
  seats: ServerSeat[];
  shownLessons: string[];
  engine: EngineSnapshot | null;
}

const ROOM_TTL_SECONDS = 7200; // 2h GC backstop
const roomKey = (code: string) => `game:room:${code}`;
const clientKey = (clientId: string) => `game:client:${clientId}`;

// DEMO: there is no host login, so we mint a plausible volunteer/coordinator name
// per room. It's broadcast in GAME_OVER so the iPad dashboard and every phone
// print the same issuer on the VIA certificates.
const HOST_NAMES = [
  'Ms Rachel Lim',
  'Mr Tan Wei Ming',
  'Mdm Siti Nurhaliza',
  'Mr Raj Kumar',
  'Ms Chloe Wong',
  'Mr Daniel Ng',
  'Ms Aisyah Rahman',
  'Mr Marcus Lee',
  'Ms Priya Nair',
  'Mr Jonathan Goh',
];
function randomHostName(): string {
  return HOST_NAMES[Math.floor(Math.random() * HOST_NAMES.length)];
}

// ── A single table/room ───────────────────────────────────────────────────────
class Room {
  code: string;
  sessionId = '';
  status: SessionStatus = 'lobby';
  hostName: string = randomHostName(); // DEMO issuer name (overwritten on restore)
  hostClientId: string | null = null; // live socket id of the host connection
  phoneClientBySeat: Record<number, string> = {}; // seat → live socket id
  seats: ServerSeat[] = [];
  engine: GameEngine | null = null;
  started = false;
  startedAt: number | null = null; // epoch ms when the game started
  hostDeleteTimer: ReturnType<typeof setTimeout> | null = null;
  // Fired after any state change so the service can write-through to Redis.
  onChange: (() => void) | null = null;
  // Fired once when the game ends, so the service can credit VIA minutes.
  onGameOver: (() => void) | null = null;
  // Lessons shown this hand (dedup) + the active learning-pause state.
  private shownLessons = new Set<string>();
  private pendingResume: (() => void) | null = null;

  constructor(
    code: string,
    private send: (clientId: string, msg: ServerMessage) => void,
    // Live socket ids currently attached to this room (host + phones + any
    // reconnected/spectating socket). Lets broadcasts survive a momentarily
    // stale seat→socket mapping.
    private listSockets: () => string[] = () => [],
  ) {
    this.code = code;
  }

  broadcastAll(msg: ServerMessage): void {
    // Deliver to every live socket in the room, deduped — so a stale
    // seat→socket entry (e.g. just after a phone reconnect) never drops a
    // broadcast like GAME_OVER.
    const ids = new Set<string>(this.listSockets());
    if (this.hostClientId) ids.add(this.hostClientId);
    for (const id of Object.values(this.phoneClientBySeat)) ids.add(id);
    for (const id of ids) this.send(id, msg);
    // Every broadcast follows a state change — persist the new snapshot.
    this.onChange?.();
  }

  private sendToSeat(seat: number, msg: ServerMessage): void {
    const id = this.phoneClientBySeat[seat];
    if (id) this.send(id, msg);
  }

  broadcastLobby(): void {
    this.broadcastAll({ type: 'LOBBY_UPDATE', seats: this.seats.map((s) => ({ ...s })) });
  }

  broadcastState(): void {
    if (!this.engine) return;
    this.broadcastAll({ type: 'STATE_UPDATE', ...this.engine.getState() });
  }

  addBot(seat: number): void {
    if (this.seats.find((s) => s.seat === seat)) return;
    this.seats.push({ seat, pairName: `Bot ${seat}`, connected: true, isBot: true, clientId: null, supabaseUserId: null });
    this.seats.sort((a, b) => a.seat - b.seat);
    this.broadcastLobby();
  }

  startGame(): { ok?: true; error?: string } {
    if (this.seats.length < 4) return { error: 'Need 4 seats' };
    if (this.started) return { error: 'Already started' };
    this.started = true;
    this.startedAt = Date.now();
    this.status = 'active';

    const engineSeats: EngineSeat[] = this.seats.map((s) => ({ seat: s.seat, pairName: s.pairName, isBot: s.isBot }));
    const engine = new GameEngine(engineSeats);
    this.engine = engine;
    this.attachEngine(engine);

    engine.startHand();
    return { ok: true };
  }

  /**
   * Wire engine events → broadcasts. Used by both startGame() and rehydration
   * (after GameEngine.deserialize), since handlers/pauseHook are not serialized.
   */
  attachEngine(engine: GameEngine): void {
    // Freeze play on a new Pung/Chi so everyone can read the lesson.
    engine.pauseHook = (info, resume) => this.handleLesson(info, resume);

    engine.on('hand_started', ({ dealerSeat, handNumber, hands }) => {
      this.shownLessons.clear(); // "new move for the round" resets each hand
      this.broadcastAll({ type: 'GAME_STARTED', dealerSeat, handNumber });
      for (const s of this.seats) {
        if (!s.isBot) this.sendToSeat(s.seat, { type: 'DEAL', hand: hands[s.seat] });
      }
      this.broadcastState();
    });

    engine.on('your_turn', ({ seat, hand, drawnTile, canWin, mustDiscard, legalClaims }) => {
      const seatInfo = this.seats.find((s) => s.seat === seat);
      if (seatInfo?.isBot) {
        setTimeout(
          () => {
            if (engine.phase !== 'playing' || engine.turnSeat !== seat) return;
            const result = botTurn({ seat, hand, drawnTile, canWin, legalClaims });
            if (result.action === 'HU') engine.declareHu(seat);
            else engine.discard(seat, result.tile);
          },
          800 + Math.random() * 600,
        );
      } else {
        this.sendToSeat(seat, { type: 'YOUR_TURN', hand, drawnTile, canWin, mustDiscard, legalClaims });
      }
      this.broadcastState();
    });

    engine.on('claim_window_open', (data) => {
      this.broadcastAll({ type: 'CLAIM_WINDOW_OPEN', ...data });
      this.broadcastState();

      for (const s of this.seats) {
        if (!s.isBot) continue;
        const myLegal = data.legalBySeat[s.seat];
        if (!myLegal || myLegal.length === 0) {
          setTimeout(() => engine.submitClaim(s.seat, null, []), 300 + Math.random() * 400);
          continue;
        }
        setTimeout(
          () => {
            if (engine.phase !== 'claim_window') return;
            const chosen = botClaim({ seat: s.seat, legalClaims: myLegal, hand: engine.hands[s.seat] });
            engine.submitClaim(s.seat, chosen ? chosen.type : null, chosen ? chosen.tiles : []);
          },
          300 + Math.random() * 1200,
        );
      }
    });

    engine.on('claim_resolved', (data) => {
      this.broadcastAll({ type: 'CLAIM_RESOLVED', ...data });
      this.broadcastState();
    });

    engine.on('hu', (data) => {
      this.broadcastAll({ type: 'HU', ...data });
      this.broadcastState();
    });

    engine.on('draw', (data) => {
      this.broadcastAll({ type: 'DRAW', ...data });
      this.broadcastState(); // so the host sees the hand_over phase (Continue prompt)
    });
    engine.on('game_over', (data) => {
      this.status = 'ended';
      this.broadcastAll({ type: 'GAME_OVER', ...data, hostName: this.hostName });
      this.onGameOver?.(); // credit volunteers' VIA minutes
    });
  }

  // ── Educational learning-pause ────────────────────────────────────────────
  private handleLesson(
    info: { claimType: 'PUNG' | 'CHI'; meld: string[]; winnerSeat: number },
    resume: () => void,
  ): void {
    const key = info.claimType === 'PUNG' ? `P:${info.meld[0]}` : `C:${[...info.meld].sort().join('-')}`;
    if (this.shownLessons.has(key)) {
      resume(); // already taught this round — don't pause again
      return;
    }
    this.shownLessons.add(key);
    this.pendingResume = resume;
    // No timer — the pause holds until the host presses continue (RESUME).
    this.broadcastAll({ type: 'LESSON', lesson: buildLesson(info.claimType, info.meld), until: 0 });
  }

  resumeFromLesson(): void {
    if (!this.pendingResume) return;
    const r = this.pendingResume;
    this.pendingResume = null;
    this.broadcastAll({ type: 'RESUME_GAME' });
    r();
  }

  /** Host pressed continue: resume a learning pause, else advance the hand. */
  hostContinue(): void {
    if (this.pendingResume) {
      this.resumeFromLesson();
    } else if (this.engine && this.engine.phase === 'hand_over') {
      this.engine.advanceHand();
    }
  }

  /** In-room actions: only the host or a seated phone may drive these. */
  handle(fromClientId: string, msg: ClientMessage): void {
    const isHost = fromClientId === this.hostClientId;
    const seatEntry = Object.entries(this.phoneClientBySeat).find(([, id]) => id === fromClientId);
    const seat = seatEntry ? Number(seatEntry[0]) : null;

    switch (msg.type) {
      case 'ADD_BOT':
        if (!isHost) return this.send(fromClientId, { type: 'ERROR', message: 'Host only' });
        this.addBot(msg.seat);
        break;
      case 'START_GAME': {
        if (!isHost) return this.send(fromClientId, { type: 'ERROR', message: 'Host only' });
        for (let i = 0; i < 4; i++) if (!this.seats.find((s) => s.seat === i)) this.addBot(i);
        const result = this.startGame();
        if (result.error) this.send(fromClientId, { type: 'ERROR', message: result.error });
        break;
      }
      case 'DISCARD': {
        if (seat === null) return this.send(fromClientId, { type: 'ERROR', message: 'No seat assigned' });
        const r = this.engine?.discard(seat, msg.tile);
        if (r?.error) this.send(fromClientId, { type: 'ERROR', message: r.error });
        break;
      }
      case 'CLAIM': {
        if (seat === null) return this.send(fromClientId, { type: 'ERROR', message: 'No seat assigned' });
        const r = this.engine?.submitClaim(seat, msg.claimType, msg.tiles || []);
        if (r?.error) this.send(fromClientId, { type: 'ERROR', message: r.error });
        break;
      }
      case 'RESUME':
        if (!isHost) return this.send(fromClientId, { type: 'ERROR', message: 'Host only' });
        this.hostContinue(); // continue past a lesson pause, or to the next hand
        break;
      case 'END_GAME':
        if (!isHost) return this.send(fromClientId, { type: 'ERROR', message: 'Host only' });
        this.engine?.endGameNow(); // stop the looping session → emits GAME_OVER
        break;
      default:
        break;
    }
  }

  // ── Redis (de)serialization ────────────────────────────────────────────────
  serialize(): RoomSnapshot {
    return {
      code: this.code,
      sessionId: this.sessionId,
      status: this.status,
      started: this.started,
      startedAt: this.startedAt,
      hostName: this.hostName,
      seats: this.seats,
      shownLessons: [...this.shownLessons],
      engine: this.engine ? this.engine.serialize() : null,
    };
  }

  /** Restore data fields from a snapshot (sockets/timers are NOT restored). */
  restore(snap: RoomSnapshot): void {
    this.sessionId = snap.sessionId;
    this.status = snap.status;
    this.started = snap.started;
    this.startedAt = snap.startedAt ?? null;
    this.hostName = snap.hostName ?? this.hostName;
    this.seats = snap.seats.map((s) => ({ ...s, connected: false }));
    this.shownLessons = new Set(snap.shownLessons);
    if (snap.engine) {
      const engine = GameEngine.deserialize(snap.engine);
      this.engine = engine;
      this.attachEngine(engine);
    }
  }
}

// ── The service: routes messages between sockets and rooms ────────────────────
@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  // Local cache of live Room objects; Redis is the source of truth.
  private readonly rooms = new Map<string, Room>();
  private readonly clientRoom = new Map<string, string>();
  private readonly sockets = new Map<string, Socket>();

  constructor(
    private readonly redis: RedisService,
    private readonly viaLog: ViaLogClient,
  ) {}

  /** Address a client by its socket id, regardless of which namespace it's on. */
  private readonly send = (clientId: string, msg: ServerMessage): void => {
    const socket = this.sockets.get(clientId);
    if (socket) socket.emit('message', msg);
  };

  /** Stable (localStorage) client id of a live socket. */
  private stableId(socketId: string): string | undefined {
    return (this.sockets.get(socketId)?.data as { clientId?: string } | undefined)?.clientId;
  }

  /** Supabase user id of a live socket (set by the auth middleware from the JWT). */
  private supabaseUserIdOf(socketId: string): string | undefined {
    return (this.sockets.get(socketId)?.data as { user?: { supabaseUserId?: string } } | undefined)
      ?.user?.supabaseUserId;
  }

  // ── Redis store helpers ────────────────────────────────────────────────────
  private newRoom(code: string): Room {
    const room = new Room(code, this.send, () => this.roomSocketIds(code));
    room.onChange = () => this.persist(room);
    room.onGameOver = () => this.creditVolunteers(room);
    this.rooms.set(code, room);
    return room;
  }

  /**
   * On game over, credit each volunteer's VIA minutes with the gameplay duration
   * (now − game start). Fire-and-forget per volunteer so a gRPC hiccup never
   * blocks the game-over flow.
   */
  private creditVolunteers(room: Room): void {
    if (!room.startedAt) return;
    const minutes = Math.ceil((Date.now() - room.startedAt) / 60000);
    if (minutes <= 0) return;
    for (const seat of room.seats) {
      if (seat.isBot || !seat.supabaseUserId) continue;
      this.viaLog
        .addViaMinutes(seat.supabaseUserId, minutes)
        .catch((err) =>
          this.logger.error(
            `Failed to credit VIA minutes for ${seat.supabaseUserId} in room ${room.code}: ${err.message}`,
          ),
        );
    }
    this.logger.log(`Credited ${minutes} VIA minute(s) to volunteers in room ${room.code}`);
  }

  /** Live socket ids currently attached to a room (from clientRoom). */
  private roomSocketIds(code: string): string[] {
    const ids: string[] = [];
    for (const [sid, c] of this.clientRoom) if (c === code) ids.push(sid);
    return ids;
  }

  /** Return the cached live room, or rehydrate it from Redis (or undefined). */
  private async loadRoom(code: string): Promise<Room | undefined> {
    const cached = this.rooms.get(code);
    if (cached) return cached;
    const raw = await this.redis.main.get(roomKey(code));
    if (!raw) return undefined;
    try {
      const snap = JSON.parse(raw) as RoomSnapshot;
      const room = this.newRoom(code);
      room.restore(snap);
      this.logger.log(`Rehydrated room ${code} from Redis (status=${room.status})`);
      return room;
    } catch (err) {
      this.logger.error(`Failed to rehydrate room ${code}: ${(err as Error).message}`);
      return undefined;
    }
  }

  /** Write-through the room snapshot to Redis (fire-and-forget, in-order). */
  private persist(room: Room): void {
    const payload = JSON.stringify(room.serialize());
    this.redis.main
      .set(roomKey(room.code), payload, 'EX', ROOM_TTL_SECONDS)
      .catch((err) => this.logger.error(`persist ${room.code} failed: ${err.message}`));
  }

  private deleteRoom(code: string): void {
    this.rooms.delete(code);
    this.redis.main.del(roomKey(code)).catch(() => undefined);
  }

  /** Record that a stable client is in a session (informational). */
  private bindClient(socketId: string, room: Room, role: ClientRole): void {
    const clientId = this.stableId(socketId);
    if (!clientId) return;
    this.redis.main
      .set(
        clientKey(clientId),
        JSON.stringify({ code: room.code, sessionId: room.sessionId, role }),
        'EX',
        ROOM_TTL_SECONDS,
      )
      .catch(() => undefined);
  }

  /** Called by a gateway when a socket connects on either namespace. */
  registerClient(socket: Socket): void {
    this.sockets.set(socket.id, socket);
  }

  /**
   * On connection, attach a host socket to its room (from the handshake room
   * code) and replay the current state. No-op message if the room is gone.
   */
  async attachHost(socketId: string, roomCode: string): Promise<void> {
    const room = await this.loadRoom(roomCode);
    if (!room) {
      this.send(socketId, { type: 'ERROR', message: 'Room not found' });
      return;
    }
    if (room.hostDeleteTimer) {
      clearTimeout(room.hostDeleteTimer);
      room.hostDeleteTimer = null;
    }
    room.hostClientId = socketId;
    this.clientRoom.set(socketId, room.code);
    this.bindClient(socketId, room, 'host');
    room.broadcastLobby();
    if (room.engine) this.send(socketId, { type: 'STATE_UPDATE', ...room.engine.getState() });
  }

  /**
   * On connection, attach a player socket to its room (from the handshake room
   * code) and replay the current state. If the client owns a seat (by stable
   * clientId) it is reclaimed with the player's hand; otherwise only the public
   * state is sent — a first-time player then takes a seat via JOIN_ROOM.
   */
  async attachPlayer(socketId: string, roomCode: string): Promise<void> {
    const room = await this.loadRoom(roomCode);
    if (!room) {
      this.send(socketId, { type: 'ERROR', message: 'Room not found' });
      return;
    }
    this.clientRoom.set(socketId, room.code);

    const stable = this.stableId(socketId);
    const seat = stable
      ? room.seats.find((s) => !s.isBot && s.clientId === stable)
      : undefined;

    if (seat) {
      seat.connected = true;
      const supabaseUserId = this.supabaseUserIdOf(socketId);
      if (supabaseUserId) seat.supabaseUserId = supabaseUserId;
      room.phoneClientBySeat[seat.seat] = socketId;
      this.bindClient(socketId, room, 'player');
      this.send(socketId, { type: 'SEAT_ASSIGNED', seat: seat.seat, pairName: seat.pairName ?? '' });
    }

    room.broadcastLobby();
    if (room.engine && seat) {
      this.send(socketId, { type: 'STATE_UPDATE', ...room.engine.getState() });
      this.send(socketId, { type: 'DEAL', hand: room.engine.hands[seat.seat] ?? [] });
      // Restore action state so the player can act if it's their turn now.
      const turn = room.engine.turnStateFor(seat.seat);
      if (turn) this.send(socketId, { type: 'YOUR_TURN', ...turn });
    } else if (room.engine) {
      this.send(socketId, { type: 'STATE_UPDATE', ...room.engine.getState() });
    }
  }

  /** Called by a gateway when a socket disconnects. */
  removeClient(clientId: string): void {
    this.sockets.delete(clientId);
    const code = this.clientRoom.get(clientId);
    this.clientRoom.delete(clientId);
    if (!code) return;
    const room = this.rooms.get(code);
    if (!room) return;

    if (room.hostClientId === clientId) {
      // Grace period so navigation/refresh can re-claim the table.
      room.hostClientId = null;
      if (room.hostDeleteTimer) clearTimeout(room.hostDeleteTimer);
      room.hostDeleteTimer = setTimeout(() => this.deleteRoom(code), 30000);
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

  /**
   * Dispatch a client message. `role` is decided by which namespace the socket
   * connected on, so a phone can never send a host action and vice-versa.
   */
  async dispatch(clientId: string, msg: ClientMessage, role: ClientRole): Promise<void> {
    if (!msg || typeof msg.type !== 'string') return;

    const allowed = role === 'host' ? HOST_MESSAGE_TYPES : PLAYER_MESSAGE_TYPES;
    if (!allowed.has(msg.type)) {
      this.send(clientId, {
        type: 'ERROR',
        message: `Message ${msg.type} is not allowed on the ${role} connection`,
      });
      return;
    }

    switch (msg.type) {
      case 'CREATE_ROOM': {
        const code = await this.generateCode();
        const room = this.newRoom(code);
        room.sessionId = randomUUID();
        room.status = 'lobby';
        room.hostClientId = clientId;
        this.clientRoom.set(clientId, code);
        this.send(clientId, { type: 'ROOM_CREATED', roomCode: code });
        this.bindClient(clientId, room, 'host');
        room.broadcastLobby();
        break;
      }
      case 'JOIN_ROOM': {
        const room = await this.loadRoom(msg.roomCode);
        if (!room) {
          this.send(clientId, { type: 'ERROR', message: 'Room not found' });
          return;
        }
        this.joinRoom(room, clientId, msg.pairName || 'Anonymous');
        break;
      }
      default: {
        const code = this.clientRoom.get(clientId);
        const room = code ? await this.loadRoom(code) : undefined;
        if (room) room.handle(clientId, msg);
        else this.send(clientId, { type: 'ERROR', message: 'Not in a room' });
      }
    }
  }

  private async generateCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    // Avoid collisions with both live rooms and persisted ones.
    for (;;) {
      code = '';
      for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
      if (this.rooms.has(code)) continue;
      if (await this.redis.main.exists(roomKey(code))) continue;
      return code;
    }
  }

  private joinRoom(room: Room, clientId: string, pairName: string): void {
    const stable = this.stableId(clientId);
    const supabaseUserId = this.supabaseUserIdOf(clientId);
    // Reclaim an existing seat by stable client id (preferred) or pair name.
    const existing = room.seats.find(
      (s) => !s.isBot && ((stable && s.clientId === stable) || s.pairName === pairName),
    );
    if (existing) {
      existing.connected = true;
      existing.pairName = pairName;
      if (stable) existing.clientId = stable;
      if (supabaseUserId) existing.supabaseUserId = supabaseUserId;
      room.phoneClientBySeat[existing.seat] = clientId;
      this.clientRoom.set(clientId, room.code);
      this.bindClient(clientId, room, 'player');
      this.send(clientId, { type: 'SEAT_ASSIGNED', seat: existing.seat, pairName });
      room.broadcastLobby();
      if (room.engine) {
        this.send(clientId, { type: 'STATE_UPDATE', ...room.engine.getState() });
        this.send(clientId, { type: 'DEAL', hand: room.engine.hands[existing.seat] ?? [] });
      }
      return;
    }

    if (room.started) {
      this.send(clientId, { type: 'ERROR', message: 'Game already started' });
      return;
    }

    const taken = room.seats.map((s) => s.seat);
    // Seat preference: South (1) first, so a single demo player sits at the
    // bottom of the iPad table facing the judge; the rest fill in around.
    const SEAT_ORDER = [1, 0, 2, 3];
    let seat: number | null = null;
    for (const i of SEAT_ORDER) {
      if (!taken.includes(i)) {
        seat = i;
        break;
      }
    }
    if (seat === null) {
      this.send(clientId, { type: 'ERROR', message: 'Room full' });
      return;
    }

    room.seats.push({
      seat,
      pairName,
      connected: true,
      isBot: false,
      clientId: stable ?? null,
      supabaseUserId: supabaseUserId ?? null,
    });
    room.seats.sort((a, b) => a.seat - b.seat);
    room.phoneClientBySeat[seat] = clientId;
    this.clientRoom.set(clientId, room.code);
    this.bindClient(clientId, room, 'player');
    this.send(clientId, { type: 'SEAT_ASSIGNED', seat, pairName });
    room.broadcastLobby();
  }
}
