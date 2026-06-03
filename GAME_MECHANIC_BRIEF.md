# Hu Knows or Don't Know — Complete Game Mechanic Brief

> Hand this to a coding LLM as the single source of truth. It is the canonical
> spec reconciled with a working reference implementation (Node + React, server-
> authoritative over WebSocket). Build to THIS document.

---

## 1. Concept in one paragraph

An anti-scam game built on **real Singapore Mahjong**. A youth and an elder share
one phone as one "seat" — the youth knows scams, the elder knows Mahjong, so they
teach each other (status flows both ways, nobody loses face). Four pairs play one
networked table at a community centre. **The iPad is the shared table everyone
watches; each phone is a private hand + input device** (Kahoot-style). Every tile
is a scam red-flag or a defence. The rules are 100% authentic Mahjong — the ONLY
divergence is a shorter winning hand. The innovation is in **what the tiles MEAN**,
not in breaking the rules.

---

## 2. The tile set — 100 tiles, LOCKED

25 distinct faces × 4 copies = **100 tiles**. Two number suits (A, B) + Winds + Dragons.

**Tile ID scheme (use exactly this):**
- Circles: `A1`–`A9`  · Bamboo: `B1`–`B9`
- Winds: `WE` `WS` `WW` `WN` (East/South/West/North)
- Dragons: `DR` `DG` `DW` (Red/Green/White)
- A physical tile instance is `BASE:copyIndex`, e.g. `A4:7`. Strip `:n` to get the base.

**The educational design breakthrough:** within each suit, tiles alternate
**odd = Precaution 🛡️ / even = Red-Flag 🚩**, ordered as a chained scam narrative.
So *every legal Chi (3-in-a-row) contains both a threat and its defence* — every
run you can legally make teaches something. The rule stays pure Mahjong; the
ordering makes it educational.

### 🔵 Suit A — Circles (筒) — Impersonation & Investment — ink colour blue `#185fa5`

| ID | # | Type | Icon | Label | Full meaning |
|----|---|------|------|-------|--------------|
| A1 | 1 | 🛡️ shield  | 🛡 | Guard Info | Guard your personal info |
| A2 | 2 | 🚩 redflag | 🪪 | NRIC?      | They ask for your NRIC |
| A3 | 3 | 🛡️ shield  | ❓ | Why?       | Ask why they need it |
| A4 | 4 | 🚩 redflag | 👮 | Fake Cop   | Fake government / police officer |
| A5 | 5 | 🛡️ shield  | 📞 | Call Back  | Hang up, call the real number back |
| A6 | 6 | 🚩 redflag | 👤 | Unknown    | Wrong-number "friend" |
| A7 | 7 | 🛡️ shield  | 🚫 | Block      | Ignore and block |
| A8 | 8 | 🚩 redflag | 💰 | Sure Win?  | "Insider" investment tip |
| A9 | 9 | 🛡️ shield  | ⚠  | Not Real   | Guaranteed returns = fake |

### 🟢 Suit B — Bamboo (條) — Urgency, Romance & Isolation — ink colour green `#1d9e75`

| ID | # | Type | Icon | Label | Full meaning |
|----|---|------|------|-------|--------------|
| B1 | 1 | 🛡️ shield  | 💡 | Gut       | Trust your gut |
| B2 | 2 | 🚩 redflag | ⏰ | Hurry!    | "Act now!" pressure |
| B3 | 3 | 🛡️ shield  | 😴 | Wait      | Sleep on it |
| B4 | 4 | 🚩 redflag | 🎰 | "Win"     | Fake lottery win |
| B5 | 5 | 🛡️ shield  | 🚷 | No Entry  | You never entered any draw |
| B6 | 6 | 🚩 redflag | ❤  | Fake Love | Romance stranger |
| B7 | 7 | 🛡️ shield  | 🤝 | Meet      | Insist on meeting in person |
| B8 | 8 | 🚩 redflag | 🤐 | Secret?   | "Don't tell anyone" |
| B9 | 9 | 🛡️ shield  | 📢 | Tell      | Tell someone you trust |

### 🀀 Winds (×4 each = 16) — the four scam archetypes — red-tinted tile background

| ID | Tile | Icon | Label | Meaning |
|----|------|------|-------|---------|
| WE | 東 East  | 🎭 | Official | Fake official / government impersonation |
| WS | 南 South | 🎣 | Phish    | Phishing bait |
| WW | 西 West  | 💎 | Offer    | Phantom offer (job/prize that doesn't exist) |
| WN | 北 North | 👻 | Friend   | Fake friend ("lost my phone" relative scam) |

### 🀄 Dragons (×4 each = 12) — the official SG "ACT" framework — gold tile background, high value

| ID | Tile | Icon | Label | Meaning |
|----|------|------|-------|---------|
| DR | 中 Red   | ➕ | ADD   | Install ScamShield · Enable 2FA · Set Money Lock |
| DG | 發 Green | ✓  | CHECK | Call 1799 · Verify with official source · Ask family |
| DW | 白 White | 📣 | TELL  | Tell family · Tell police · Tell community |

**Count check:** 36 (A) + 36 (B) + 16 (Winds) + 12 (Dragons) = **100** ✓

---

## 3. The rules — LOCKED

| Element | Rule | Note |
|---------|------|------|
| Players | 4 seats, each a youth+elder pair | empty seats filled by server bots |
| Deal | 10 tiles to each player | (not 13 — hand is scoped down) |
| Turn cycle | Draw 1 → discard 1, counter-clockwise | authentic |
| **Win condition** | **3 sets + 1 pair** = 11 tiles, won on the 12th draw/claim | the ONE deliberate divergence (real MJ is 4 sets + pair) |
| Set via **Chi** | 3 consecutive same-suit tiles (A or B only); claimable **only from the player to your left** (the seat immediately before you) | authentic |
| Set via **Pung** | 3 identical tiles; claimable from **anyone**, out of turn | authentic |
| Pair (eye) | 2 identical tiles | authentic |
| Kong | **CUT** for MVP | simplification |
| Claim priority | **HU > PUNG > CHI** | authentic |
| Claim window | Server-managed, fixed **4-second** window after each discard | engineered — this is the key tractability choice, protect it |
| Claim interrupt | A Pung/Hu **jumps turn order** — play moves to the claimer, who then discards (no draw) | authentic |
| Melded sets | Shown **face-up on the iPad** (public) | authentic |
| Concealed hand | Private to the owning phone; iPad sees only a count | co-located game, no anti-cheat needed |
| Scoring / fan | **CUT** — a win is a win; the "score" is scam knowledge | simplification |

**Educational overlay (changes no rules):**
- **Pung** = pattern recognition ("3 of the same scam archetype — I've seen this trick").
- **Chi** = connecting a threat to its defence (suits are chained, so every run is threat→defence).
- **Hu** = you built a complete defence.

---

## 4. Win-check algorithm (reference, language-agnostic)

```
canWin(tiles, meldCount):
    setsNeeded = 3 - meldCount
    if tiles.length != setsNeeded*3 + 2: return false      # must be exact
    bases = tiles stripped of :copy
    # try every distinct tile as the PAIR, then recurse on the rest
    for each distinct base t with count >= 2 in bases:
        rest = bases minus two t
        if canFormSets(rest, setsNeeded): return true
    return false

canFormSets(tiles, n):
    if n == 0: return tiles.isEmpty
    sort tiles; t = first
    # try Pung
    if count(t) >= 3 and canFormSets(tiles - 3*t, n-1): return true
    # try Chi (suit A or B only): t, t+1, t+2 of same suit
    if t is suit A/B and tiles has t,(t+1),(t+2):
        if canFormSets(tiles - {t,t+1,t+2}, n-1): return true
    return false
```

`meldCount` matters: each claimed Pung/Chi is already a completed set sitting
face-up, so the concealed hand only needs `3 - meldCount` more sets + the pair.

**Legal-claims on a discard** (server computes for every seat, because it sees all hands):
- **HU**: `canWin(hand + discard, meldCount)` is true.
- **PUNG**: hand holds ≥ 2 of the discard's base.
- **CHI**: the discarding seat is immediately to this seat's left, AND hand holds
  two tiles that complete a same-suit run with the discard (check the 3 windows
  `[d-2,d-1,d]`, `[d-1,d,d+1]`, `[d,d+1,d+2]`, bounded to 1..9). Return each valid
  trio so the phone can show the choice.

> ⚠️ **Known bug to fix in the reference code:** in `getLegalClaims`, the HU check
> hardcodes `meldCount = 0`. A claimer who already has melds won't be offered a
> winning HU claim. Pass the seat's real `melds.length` into the win check.

---

## 5. Turn / claim game loop (server is the only brain)

```
on DISCARD(seat, tile):
    require seat == turnSeat and tile in hand
    move tile from hand → discardPile; set lastDiscard
    legal = computeLegalClaims(lastDiscard) for every OTHER seat   # server sees all hands
    if no seat has any legal claim:
        advanceTurn()                 # next seat (counter-clockwise) draws
    else:
        phase = claim_window
        closesAt = now + 4s
        broadcast CLAIM_WINDOW_OPEN { lastDiscard, closesAt, legalBySeat }
        # each phone shows ONLY the buttons it is legally offered; others show nothing

on CLAIM(seat, type, tiles):     # the only-other phone action; sending nothing = pass
    if window open and claim legal: record it
    if every eligible seat has responded: resolve immediately (don't wait out the clock)

on window timer expires OR all responded:
    winner = resolvePriority(claims)         # HU > PUNG > CHI; CHI only from left seat
    if winner == null:
        advanceTurn()
    else:
        move tiles into winner's public melds
        broadcast CLAIM_RESOLVED
        if meld is educational: broadcast SCAM_CARD (see §6)
        if type == HU: handleWin(winner)     # celebrate, then next hand
        else:
            turnSeat = winner                # INTERRUPT: turn jumps to claimer
            send YOUR_TURN to claimer         # they discard, no draw

advanceTurn():
    if wall empty: end hand as a draw (no winner)
    else: turnSeat = next seat; that seat draws 1; if its hand canWin → offer self-draw HU
```

**Bots** are not separate AI — they're the server playing a seat with the same
validated state. On `YOUR_TURN`: discard the lowest-value tile (heuristic: keep
pairs/runs). During a claim window: HU always; Pung honours/dragons ~80%, suit
tiles ~40%; Chi ~30%; else pass. Always emit a pass so windows close fast.

---

## 6. Educational moment — Scam DNA cards

When a Pung/Chi/Hu completes on certain tiles, the iPad slides in a cited card.
These are the trigger tiles and exact content (real SPF/MAS 2025 figures):

| Trigger | Title | Stat | Tool | Source |
|---------|-------|------|------|--------|
| WE | Govt Impersonation | $242.9M lost to govt impersonation in 2025, +60.5% Y/Y | Call 1799 to verify any govt call | SPF Annual Scams Brief 2025 |
| WN | Fake Friend | "Lost my phone" relative scam remains top-5 elder scam | Call the real person on a known number first | SPF 2025 |
| WS | Phishing | 84% of scam cases involved online platforms | Enable 2FA · Never click unverified links | SPF 2025 |
| WW | Phantom Offer | Investment + job scams combined: $200M+ in 2025 | Verify on ScamAlert.sg · Call 1799 | SPF 2025 |
| B2 | Urgency Pressure | 73% of bank-impersonation scams used a 24-hour deadline | Real banks never demand instant action | SPF 2025 |
| B8 | Secrecy Signal | "Don't tell family" is the red flag before a transfer request | Tell someone you trust immediately | SPF 2025 |
| DR | ADD Protections | Money Lock: 479,000 customers locked ~$44B from transfers | Enable Money Lock at your bank today | MAS 2025 |
| DG | CHECK First | ScamShield blocked 120,000+ scam entities since 2022 | Call 1799 (ScamShield Helpline, 24/7) | SPF 2025 |
| DW | TELL Someone | Scam cases fell 24.8% in 2025 — first-ever decline in Singapore | Report to police.gov.sg · Tell your community | SPF 2025 |
| A4 | Fake Police | Real police never ask you to transfer money or "safeguard" funds | Hang up · Call 999 to verify | SPF Advisory |

**End-of-game headline stats** (for the win/end card): **$913.1M** total losses
2025; **81.8%** self-effected transfers; seniors 65+ lost avg **$37,053** (~8×
youth). Hotline is **1799** (not 1733).

---

## 7. Architecture

```
  Phone (pair)        iPad (table host)        Phone (pair)
  private hand        shared display           private hand
  + action buttons    + QR / join code         + action buttons
       └──────────────────┴──────────────────────┘
                          │  WebSocket
                  Server (the only brain)
              Game engine + room manager + bots
                          │
                    Redis (game state, one key per room)   # optional for MVP; in-memory is fine
```

**The single principle that keeps the build tractable:**
> The server is the ONLY brain. Phones send exactly TWO message types
> (`DISCARD`, `CLAIM`). Every client is a thin renderer of server state.
> No client ever computes legality. If you're writing game logic on a phone, stop.

- **iPad** = host: creates room, shows join QR/code, renders the shared table. Sends NO game actions.
- **Phone** = input client: renders its own hand + only the valid actions. Sends only `DISCARD` and `CLAIM`.
- **Server** = holds full state, validates every action, runs the 4s claim window, resolves priority, broadcasts to all clients.

**Stack (reference):** Node.js + `ws` on the server; React + Vite on the client
(phone view and iPad view are two routes of the same app); WebSocket for all
real-time. Redis optional for MVP — in-memory map per room works for a demo.

---

## 8. WebSocket message protocol

All messages are JSON `{ "type": "...", ...payload }`. **C→S** = client→server, **S→C** = server→client.

### Room setup
| Dir | Type | Payload | Who |
|-----|------|---------|-----|
| C→S | `CREATE_ROOM` | — | iPad |
| S→C | `ROOM_CREATED` | `{ roomCode }` | →iPad |
| C→S | `JOIN_ROOM` | `{ roomCode, pairName }` | phone |
| S→C | `SEAT_ASSIGNED` | `{ seat }` | →that phone |
| S→C | `LOBBY_UPDATE` | `{ seats:[{seat,pairName,isBot}] }` | →all |
| C→S | `ADD_BOT` | `{ seat }` | iPad |
| C→S | `START_GAME` | — | iPad (auto-fills empty seats with bots) |

### Gameplay — only two actions ever come FROM a phone
| Dir | Type | Payload | Notes |
|-----|------|---------|-------|
| S→C | `GAME_STARTED` | `{ dealerSeat, handNumber }` | →all |
| S→C | `DEAL` | `{ hand }` | →each phone **privately** (its own 10 tiles only) |
| S→C | `STATE_UPDATE` | full public state (below) | →all — the heartbeat |
| S→C | `YOUR_TURN` | `{ hand, drawnTile, canWin, mustDiscard, legalClaims }` | →one phone |
| **C→S** | **`DISCARD`** | `{ tile }` | phone action #1 |
| S→C | `CLAIM_WINDOW_OPEN` | `{ lastDiscard, bySeat, closesAt, legalBySeat }` | →all; iPad shows the shrinking gold timer |
| **C→S** | **`CLAIM`** | `{ claimType:"PUNG"\|"CHI"\|"HU"\|null, tiles }` | phone action #2; `null` = pass |
| S→C | `CLAIM_RESOLVED` | `{ winnerSeat, type, meld }` | →all |
| S→C | `SCAM_CARD` | `{ title, stat, tool, src }` | →all — the teaching moment |
| S→C | `HU` | `{ winnerSeat, pairName, hand, melds }` | →all — win celebration |
| S→C | `DRAW` | `{ message }` | →all — wall exhausted, no winner |
| S→C | `GAME_OVER` | `{ tableSummary:[{seat,pairName,wins}], hands }` | →all |
| S→C | `ERROR` | `{ message }` | →one — illegal action (should never fire if phone only shows legal buttons) |

### `STATE_UPDATE` public payload (what the iPad renders)
```jsonc
{
  "type": "STATE_UPDATE",
  "phase": "playing | claim_window | hand_over | game_over",
  "turnSeat": 2,
  "lastDiscard": "A4:7",
  "lastDiscardSeat": 1,
  "wallCount": 47,
  "discardPile": [ { "tile": "A4:7", "bySeat": 1 } ],
  "seats": [
    { "seat": 0, "pairName": "Sarah & Mdm Tan", "handCount": 10, "melds": [ ... ], "isBot": false }
    // handCount only — NEVER the concealed tiles
  ],
  "claimWindow": { "bySeat": 1, "closesAt": 1718000004000, "legalBySeat": { "0": [ ... ] } } // or null
}
```
The concealed `hand` array is sent **only** to the owning phone (via `DEAL` / `YOUR_TURN`). Melds are public.

---

## 9. Frontend responsibilities

**Phone client (private, deliberately dumb):**
- Renders its own 10 tiles (sorted; a Sort button).
- Shows **ONLY valid actions** — Pung/Chi/Hu buttons appear only when actually
  playable; the action zone is empty ("breathes") when there's nothing to do.
  Never render greyed-out rows.
- Each action button: plain-English verb + Mahjong term subtitle, e.g.
  **"Grab it → Pung"**, **"Connect them → Chi"**, **"Win! → Hu"**.
- A soft gold shrinking-bar timer during a claim window.
- Footer: Sort · Language (EN / 中文 / Malay / Tamil) · Help.
- Sends only `DISCARD` and `CLAIM`.

**iPad client (shared spectacle, display-only):**
- Felt-green table, 4 seats around it, each labelled with the pair name; each
  non-South seat **rotated to read upright from that physical seat**.
- Centre discard pool; the latest discard enlarged with a gold glow.
- Wall counter; melded sets shown face-up at each seat.
- Scam DNA card slides in on a teaching event.
- "Hu! / Defended!" celebration (tiles erupt, confetti, sound).
- NO action buttons.

**Design tokens:** felt `#1f3520`; ivory tile `#f5e9c8` with brown bevel `#c4a572`;
gold highlight `#fbbf24`; pair labels warm sand `#d4b483`. Suit ink: Circles blue
`#185fa5`, Bamboo green `#1d9e75`, red/characters `#b91c1c`. One reusable tile
"shell": ivory body, bevel, number top-left (suit colour), one centre icon (~60%
height), one-word label under it, green weave for the face-down back. Test
legibility at ~40px.

---

## 10. Build order (always have something demoable)

1. **Server brain + 1 phone + iPad, 1 human vs 3 server-bots, real WebSocket.**
   If only this works, you still have a live networked demo.
2. **QR join flow** → multiple phones into one room (the Kahoot moment).
3. **Scale to 4 real pairs** — same code, bots swapped for humans.
4. **Polish LAST** (budget for it): eruption animation, card slides, celebration.
   This is the wow — don't let the rules engine eat all the time.

**Protect above all: the 4-second server-managed claim window.** It's what makes
networked Mahjong tractable. If you find yourself building a live free-for-all
claim race, stop — you've wandered into the hard version.

**Stage failsafe:** also build a **Demo-Mode** — a fixed rigged game state with a
scripted Pung→Chi→Hu in ~90 seconds and a one-tap reset — so a venue-WiFi wobble
can't kill the pitch. (The current reference build plays a *real randomized* game;
the scripted demo is not built yet and should be added for stage.)
