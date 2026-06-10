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

The game is **entirely server-side**: the UI is a thin client and the server is the
only brain. There is no in-browser mock or `BroadcastChannel` anymore. The original
Node engine was ported into the backend (`services/game-service-demo`, and the
Redis-backed `services/game-service`).

The UI connects over **Socket.IO** (same origin, behind nginx). Two backends are
chosen by the route `variant`:

- **`demo`** (the `/demo/...` routes) talks to `/api/game-service-demo`: in-memory,
  no auth, the open demo flow.
- **`app`** (the `/app/...` routes, auth-gated by `AppGate`) talks to
  `/api/game-service`: Redis-backed, host-authenticated. The gameClient names this
  backend `prod`.

**The only transport seam is `lib/net/gameClient.ts`.** It picks the Socket.IO
namespace by role (`host` to `/host`, `player` to `/play`) and the base path by
variant, sends a `clientId` plus optional `roomCode` so the server replays state on
reconnect, and reconnects forever with backoff for flaky phone networks.

## Entry modes (route variant + learn)

The app is reached through a route `variant` segment (`app/[variant]/...`). Anything
that is not `app` falls back to `demo`.

- **`/demo`** is a short, self-contained, no-login demonstration of the entire game
  flow on the in-memory `game-service-demo` backend. This is the main way the game is
  shown on the hackathon stage, so judges can watch a full round and see how Pung, Chi,
  and Hu work end to end. The demo also runs the end-of-game review quiz on each phone.
- **`/app`** is the full production version: Supabase auth and onboarding, the
  Redis-backed `game-service`, role-gated (organiser vs volunteer), the VIA-minutes
  dashboard, and the end-of-game certificate or dashboard handoff. The route maps to the
  `prod` backend in `gameClient`.
- **`/<variant>/learn`** is a learn mode (`app/[variant]/learn/page.tsx`): an interactive
  tutorial that teaches players the key moves (Pung, Chi, Hu) and how to win. It is meant
  for players once the demo becomes a real game, is reachable from the lobby Learn button,
  and works under either variant (`/demo/learn`, `/app/learn`).

## File map

```
app/
  layout.tsx                           fonts (Source Serif 4/Noto SC/JetBrains Mono) + metadata
  globals.css                          Tailwind v4 import + @theme design tokens + keyframes
  page.tsx                             re-exports the demo lobby for "/"
  [variant]/layout.tsx                 AppGate (auth) for variant "app"; pass-through for "demo"
  [variant]/page.tsx                   Lobby (create table / join / demo)
  [variant]/host/[roomCode]/page.tsx   Shared table board (display only); replays state on connect
  [variant]/play/[roomCode]/page.tsx   Phone: private hand + ActionZone (sends DISCARD/CLAIM)
  [variant]/login|onboarding|dashboard|learn   auth + onboarding + VIA dashboard + tutorial
components/
  Tile, TileIcon, TileRack, MeldGroup, DiscardPool, SeatBlock, ActionZone,
  AppGate, AppHeader, FullscreenButton
  ScamCard        iPad lesson popup: two-stage (lesson + stat, then the real-life case study)
  CaseStudyView   shared body for a scam case study (what it is / SG example / red flags / actions)
  PauseCheck      phone in-pause check: spot the scam, then pick the safe action
  TileInfoCard    phone tap-to-explain sheet for a single tile
  ReviewQuiz      end-of-game scam recap quiz (built from the session's Pung/Chi claims)
lib/
  tiles.ts        25 tile faces (suits A/B/W/D), DNA scam cards, seat names
  tileIcons.ts    base id to Lucide icon mapping
  rules.ts        buildWall / canWin / getLegalClaims / findChiOptions / sortHand / decomposeWin
  types.ts        GameState + full client/server message protocol
  ui.ts           shared Tailwind class strings (buttons, inputs, felt bg)
  useGameSocket.ts   React hook over the transport
  net/gameClient.ts  TRANSPORT SEAM: Socket.IO; demo vs prod backend, host vs play namespace
  net/clientIdentity.ts  stable per-device clientId (session recovery)
  auth.ts, supabaseClient.ts  Supabase auth (the "app" variant)
  via.ts          VIA-minutes helpers (volunteer credit)
  cert.ts         end-of-game certificate
  education.ts    buildLesson + Lesson type + whatToDo (mirrors the server engine)
  caseStudies.ts  real-life SG case studies (10 Scam-DNA tiles) + the in-pause check options
```

## Rules implemented

Win/claim logic lives in `lib/rules.ts` (client-side validation + the win-card
decomposition) and is mirrored authoritatively in the server engine
(`services/game-service-demo` and `services/game-service`). The server is the only
brain; the client copy only validates and renders.

- 100-tile wall (4 copies of each of the 25 bases). 10-tile deal; win = **3 sets + 1
  pair** (11 tiles). Chi only from the seat immediately before you, and only on the
  number suits (circles `A` / bamboo `B`); Pung from anyone; priority
  **HU > PUNG > CHI**; a fixed **4-second** claim window; no scoring. There is
  currently **no Kong** in the engine (the brief mentions it; the code does not
  implement it).
- Scam-DNA cards fire on trigger tiles; the end card shows 2025 SPF/MAS stats.
- The game **never auto-ends**: it keeps dealing new hands (dealer rotates each hand)
  until the host ends it.
- **Brief §4 bug fixed:** `getLegalClaims` takes the seat's real `meldCount`
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
  **flies toward the claimer's seat** relative to the shared table (seat 0 to right,
  1 to bottom, 2 to left, 3 to top); see the `animate-claim-*` keyframes and
  `SEAT_DIR` in the host page (`app/[variant]/host/[roomCode]/page.tsx`).
- **Hu**: winning tiles pop in one-by-one (`--animate-pop-in`, staggered).
- Active seat name pulses; selected tile lifts; last discard glows; scam card slides in.

## Educational pause (Pung/Chi)

Every claimed Pung/Chi pauses the game for a scam-defence teaching moment. The server
builds a `Lesson` (`buildLesson`, mirrored on both server engines) and broadcasts a
`LESSON` to all clients. The richer case-study content is derived purely on the frontend
from the triggering tile bases (`lib/caseStudies.ts`, keyed by base id, covering the 10
Scam-DNA tiles), so no message-protocol change was needed.

- **iPad (`ScamCard`)** shows two stages: stage 1 = the tip + the cited SPF/MAS stat;
  the host presses "See real example" for stage 2 = the real-life Singapore case study
  (what it is / a past case / red flags / actions). A final "Got it, continue" sends
  `RESUME`. `ipad` mode mirrors stage 1 for the far side; `projector` mode is one big card.
- **Phone** mirrors the same case study in a bottom sheet so the younger player teaches
  the elder, then a second step (`PauseCheck`) tests them: spot the scam, then pick the
  safe action (options built from the case study plus a shared wrong-action pool). It is
  non-blocking; the host controls when the game resumes.
- **Reconnect safety (server):** the held lesson is remembered and re-emitted to any
  host/phone that reconnects mid-pause, and a safety-net timer auto-resumes after 5 min
  if the host never continues, so an iPad refresh mid-lesson can no longer soft-lock the
  table. See `pendingLesson` / `replayLessonTo` / `LESSON_AUTO_RESUME_MS` in both
  services' `game.service.ts`.
- A meld on a non-Scam-DNA tile shows stage 1 only on the iPad and a "look up" banner on
  the phone.

## Status

- [x] Full UI (Lobby / Host table / Phone) in TS + Tailwind, original look.
- [x] Server-authoritative engine: the old in-browser mock was ported into
      `game-service-demo` / `game-service`; the UI talks to it over Socket.IO.
- [x] Two backends wired by the route variant: open `demo` and auth-gated `app`.
- [x] Supabase auth + onboarding, VIA-minutes dashboard, end-of-game certificate.
- [x] Session recovery: `clientId` + `roomCode` let the server replay state on reconnect.
- [x] Action buttons use plain-verb + Mahjong term ("Grab it → Pung", etc.).
- [x] Position-aware claim animations + Hu pop-in celebration.
- [x] Tile-art pipeline (batch image-gen) + Lucide icon set (default) + emoji fallback.
- [x] Educational pause: two-stage iPad lesson + real-life case study, mirrored to phones
      with an in-pause spot-and-fix check; end-of-game recap quiz on each phone.
- [x] Soft-lock fix: a held lesson is replayed on host/phone reconnect, plus a 5 min
      safety-net auto-resume, so an iPad refresh mid-lesson cannot freeze the table.
- [ ] Cross-device playthrough hardening on real phones (reconnection, backgrounded Safari).
- [ ] Open product items (see `../HANDOVER.md`): make scam knowledge affect a game
      decision; a Mandarin layer for elder-facing content; real news images for case studies.

## Run

```bash
# Full stack (the game needs the backend; there is no mock). See repo README.
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
# http://localhost                  -> demo lobby
# create table -> /demo/host/CODE   (shared table board)
# scan QR      -> /demo/play/CODE   (phone hand)
# the auth-gated flow lives under /app/... (login required)

# Frontend-only UI dev (no game backend wired)
cd frontend && npm install && npm run dev    # http://localhost:3000
```

> Repo-wide rules (no em-dashes, serif UI font) and the Karpathy coding
> guidelines live in the root `../CLAUDE.md` and apply here too.
