# Hu Knows — Frontend (Next.js) · Plan & Status

> Working notes for anyone (human or AI) picking this up. The authoritative game
> design is the **Game Mechanic Brief** the team maintains separately; this file
> tracks how the frontend implements it and what's done vs. pending.

## Overarching plan

Migrate the original standalone **Vite + React (JS)** anti-scam Mahjong app into
this monorepo's **Next.js frontend**, matching the repo conventions:

- **Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind v4.**
- Visual style is a faithful reproduction of the original (felt table, ivory
  tiles, gold accents) — rebuilt with Tailwind utilities + design tokens.
- The game is multi-device: the **iPad** is the shared table (display-only), each
  **phone** is a private hand + the only thing that sends actions (`DISCARD`,
  `CLAIM`). The **server is the only brain.**

### Backend strategy (important)

The repo's `services/game-service` is currently a hello-world **Socket.IO** stub —
it has no engine/rooms/bots yet. So the frontend ships with an **in-browser mock
server** that ports the original Node game engine. Tabs talk over a
`BroadcastChannel`; the tab that creates a room **hosts** its engine (mirroring
"the iPad is the table"). This makes the whole flow demoable today with zero
backend.

**The only seam is `lib/net/gameClient.ts`.** When `game-service` becomes real,
set `NEXT_PUBLIC_GAME_TRANSPORT=socketio` and the UI connects to Socket.IO at
`/api/game-service/socket.io` (already routed by nginx) — no UI changes.

## File map

```
app/
  layout.tsx                  fonts (Inter/Noto SC/JetBrains Mono) + metadata
  globals.css                 Tailwind v4 import + @theme design tokens + keyframes
  page.tsx                    Lobby (create table / join / demo)
  ipad/[roomCode]/page.tsx    Shared table (display only); REJOIN_IPADs on connect
  play/[roomCode]/page.tsx    Phone: private hand + ActionZone (sends DISCARD/CLAIM)
components/
  Tile, TileIcon, TileRack, MeldGroup, DiscardPool, SeatBlock, ActionZone, ScamCard
lib/
  tiles.ts        25 tile faces, DNA scam cards, seat names
  tileIcons.ts    base id → Lucide icon mapping
  rules.ts        canWin / getLegalClaims / findChiOptions / sortHand / wall
  types.ts        GameState + full client/server message protocol
  ui.ts           shared Tailwind class strings (buttons, inputs, felt bg)
  useGameSocket.ts  React hook over the transport
  net/gameClient.ts  TRANSPORT SEAM: mock (default) vs socket.io
  mock/engine.ts   ported Mahjong engine (turns, claims, scoring)
  mock/bot.ts      bot discard/claim heuristics
  mock/mockServer.ts  room manager + BroadcastChannel bus (hosts the engine)
```

## Rules implemented (per brief)

- 10-tile deal; win = **3 sets + 1 pair** (11 tiles). Chi from left only; Pung from
  anyone; priority **HU > PUNG > CHI**; fixed **4-second** claim window; Kong cut;
  no scoring. Scam-DNA cards on trigger tiles; end card shows 2025 SPF/MAS stats.
- **Brief §4 bug fixed:** `getLegalClaims` now takes the seat's real `meldCount`
  (the original hardcoded 0, so melded players were never offered a winning HU).

## Tile rendering & icons

A tile shows: **number top-left** (suit colour) + a **centred icon** + small label.
No hanzi corner — the **suit colour** signals the suit (circles=blue, bamboo=green,
winds=red, dragons=gold). `components/TileIcon.tsx` picks the icon source in order:

1. **AI PNG** `public/tiles/<base>.png` — only if `NEXT_PUBLIC_TILE_IMAGES=1`
   (composited with `mix-blend-multiply`).
2. **Lucide vector icon** (`lib/tileIcons.ts`), drawn in the suit colour — **default**.
3. **Emoji** glyph — last-resort fallback.

Tiles were enlarged for real iPad/phone screens; the iPad table grid is viewport-
responsive (`vw`/`vh`) to fill the device.

```bash
# (optional) regenerate the AI PNGs — Lucide is the default and needs no key
cd frontend && export OPENAI_API_KEY=sk-...
node scripts/generate-tiles.mjs                 # all 25 (resumable; --force to redo)
NEXT_PUBLIC_TILE_IMAGES=1 npm run dev           # render the PNGs instead of Lucide
```

## Animations

- **Pung/Chi claim**: a centre burst (red badge=Pung, gold=Chi) with the meld tiles
  **flies toward the claimer's seat** relative to the iPad (seat 0→right, 1→down,
  2→left, 3→up) — see `--animate-claim-*` keyframes + `SEAT_DIR` in the iPad page.
- **Hu**: winning tiles pop in one-by-one (`--animate-pop-in`, staggered).
- Active seat name pulses; selected tile lifts; last discard glows; scam card slides in.

## Status

- [x] Full UI ported (Lobby / iPad / Phone) in TS + Tailwind, original look.
- [x] Game engine + bots + rooms ported into the in-browser mock.
- [x] BroadcastChannel transport so iPad + phone tabs share one game.
- [x] Action buttons use plain-verb + Mahjong term ("Grab it → Pung", etc.).
- [x] **Build green** — `next build` typechecks + lints clean (4 routes).
- [x] **Engine verified** — headless 4-bot sim: full game, claims+DNA fire, every
      declared win passes `canWin`, no crashes. Routes serve 200 with no SSR errors.
- [x] Tile-art pipeline (batch image-gen) + Lucide icon set (default) + emoji fallback.
- [x] Bigger tiles + viewport-responsive iPad/phone layouts.
- [x] Position-aware claim animations + Hu pop-in celebration.
- [ ] Browser playthrough across tabs (needs a real browser; mock is same-browser only).
- [ ] Swap mock → real `game-service` (Socket.IO) once the backend exists.

## Mock limitation (read before demoing)

`BroadcastChannel` only connects tabs/windows of the **same browser on one machine**.
So the mock demos great with the iPad route in one window + phone routes in other
windows on the same laptop — but **not across physical devices** (a real iPad + real
phones scanning the QR). That cross-device flow needs the real `game-service`.

## Run

```bash
# Standalone dev
cd frontend && npm install && npm run dev    # http://localhost:3000

# Full stack (per repo README)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
# http://localhost  → lobby; create table → /ipad/CODE; scan QR → /play/CODE
```
