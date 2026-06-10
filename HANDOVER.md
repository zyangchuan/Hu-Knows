# Hu Knows - Handover

Last updated: 2026-06-10. Branch: `main`.

This note is for whoever picks the project up next. It covers what changed in the most
recent run of work, how to run and test it, what was verified, and the open items worth
doing before the finals. Repo-wide rules (no em-dashes, serif UI font, the Karpathy
coding guidelines) live in `CLAUDE.md`; the frontend plan and file map live in
`frontend/CLAUDE.md`.

## TL;DR of this push

1. **New feature: the Pung/Chi educational pause is now a real teaching moment.** When a
   Pung or Chi is claimed, the iPad shows a two-stage scam lesson (the stat, then a
   real-life Singapore case study), and the same case study mirrors to each phone so the
   younger player can teach the elder, followed by a short "spot it, then fix it" check.
2. **A red-team pass found and fixed 5 defects**, including a high-severity soft-lock that
   could freeze a live demo. All five are applied and verified.
3. **Also included in this push** is earlier uncommitted work: the em-dash cleanup, the
   serif-font switch, the end-of-game `ReviewQuiz`, the per-tile `TileInfoCard`, and the
   expanded `CLAUDE.md` guidance.

## 1. The educational pause (the headline feature)

When a Pung/Chi resolves, the server pauses the game and broadcasts a `LESSON` to every
client. The case-study content is derived **purely on the frontend** from the triggering
tile bases (no message-protocol change), in `frontend/lib/caseStudies.ts`, keyed by base
id, covering the 10 Scam-DNA tiles (WE, WN, WS, WW, B2, B8, A4, DR, DG, DW).

- **iPad (`frontend/components/ScamCard.tsx`)** is two-stage: stage 1 is the tip + the
  cited SPF/MAS stat; "See real example" reveals stage 2, the real-life case study (what
  the scam is, a past Singapore case, the red flags, the actions). A final "Got it,
  continue" resumes. `ipad` mode mirrors stage 1 for the far side of the table;
  `projector` mode is one big card.
- **Phone (`frontend/app/[variant]/play/[roomCode]/page.tsx`)** mirrors the case study in
  a bottom sheet (`CaseStudyView`), then a second step (`PauseCheck`) tests the pair:
  "spot it" (scam red flag vs safe move) then "fix it" (pick the safe action from real
  options). It is non-blocking; the host controls when play resumes.
- A meld on a non-Scam-DNA tile shows stage 1 only on the iPad and a "look up at the
  table" banner on the phone.

New/changed files for this feature:
`frontend/lib/caseStudies.ts` (new), `frontend/components/CaseStudyView.tsx` (new),
`frontend/components/PauseCheck.tsx` (new), `frontend/components/ScamCard.tsx`,
`frontend/app/[variant]/play/[roomCode]/page.tsx`, `frontend/components/TileInfoCard.tsx`.

Images are optional and currently unset: drop files into `frontend/public/case-studies/`
and set the `image` field on a `ScamCase` to show a news picture (graceful text-only
fallback otherwise).

## 2. Bug fixes from the red-team pass

A multi-agent review audited the code and idea against the BrainHack Open Category
criteria. Five defects were fixed (designs vetted by two adversarial review agents):

1. **High - soft-lock on host refresh mid-lesson.** The held pause lived only in a
   one-shot `LESSON` event plus an in-memory closure; reconnection replays only
   `STATE_UPDATE`, so an iPad refresh (or a phone reconnect) during a lesson could freeze
   the whole table with no way to resume. Fix (server-only, both services'
   `game.service.ts`, kept in parity): remember the active lesson (`pendingLesson`) and
   re-emit it to any host/phone that reconnects (`replayLessonTo`), plus a 5 minute
   safety-net auto-resume (`LESSON_AUTO_RESUME_MS`) so a vanished host can never lock the
   table; the timer is cleared on resume and on room teardown.
2. **Med - `PauseCheck` mismarked the action tiles (DR/DG/DW).** Their example narrates a
   scam that a good habit prevented, so "safe move" was the correct answer but users
   tapped "scam" and were told they were wrong. Now the question is reframed for action
   tiles ("Is the habit shown here a safe move...?") with the intuitive option first.
3. **Med - overlay z-index / `infoTile`.** The phone case-study sheet and `TileInfoCard`
   shared `z-[170]`; the sheet is now `z-[180]` and an open tile popup is cleared when a
   lesson opens.
4. **Low - `buildFixOptions` guard** against an empty `actions` array (would have thrown).
5. **Low - button-style drift**: `ScamCard`/`TileInfoCard` now build on the shared
   `lib/ui` `btnGold`/`btnGhost` instead of duplicating the gradient.

Out of scope (pre-existing, tracked, not a regression): a full server **process restart**
mid-pause still loses the held resume because the pause state is live-only (not in the
Redis snapshot). Fixing it would mean serializing the pending claim-discard seat on the
engine snapshot.

## How to run and test locally

```bash
# Full stack (the game needs the backend; there is no in-browser mock).
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
# http://localhost                -> demo lobby
# create table -> /demo/host/CODE -> add bots -> Start
# join on a phone window -> /demo/play/CODE
```

The dev stack bind-mounts source and runs in watch mode, so edits hot-reload. Copy
`.env.dev.example` to `.env.dev` and fill in Supabase values for the auth-gated `/app`
flow (the open `/demo` flow needs no env).

To exercise the feature: play until a Pung/Chi lands on a Scam-DNA tile (e.g. a wind).
Confirm on the iPad: stage 1 (stat) then "See real example" then stage 2 (case study).
Confirm on the phone: the teaching sheet, then "Now test together" reveals the spot/fix
check. To confirm the soft-lock fix: hard-refresh the host iPad mid-lesson; the card and
its Continue button should return.

## What was verified

- Frontend `tsc --noEmit`: clean (exit 0).
- Both game services recompiled in their dev containers: `Found 0 errors`, started OK.
- No em-dashes introduced (repo rule); the old `// No timer -` comment was removed.

Not yet done: a full manual cross-device playthrough on real phones, and a live repro of
the soft-lock fix on the running stack (worth doing before the finals).

## Open items / next steps (by leverage)

These are product decisions, intentionally left for the team:

1. **Make scam knowledge affect a game decision** (e.g. a visible bonus for completing a
   "threat -> defence" Chi). This is the strongest answer to the "it's a quiz with a
   Mahjong skin" critique, because today you can win the game knowing nothing about scams.
2. **A Mandarin layer** for the elder-facing content (tile labels + the iPad case study);
   the audience is largely Mandarin-speaking elderly and all learning copy is English.
3. **Ship real news images** into `frontend/public/case-studies/` so "real cases" is shown,
   not just asserted, and extend coverage beyond the current 10 tiles.
4. Smaller: a "look at the iPad / your phone" attention cue during the pause; reduce the
   per-pause reading load on the phone for low-vision users.

A fuller red-team write-up (strengths, weaknesses, and the questions a tough judge will
ask) was produced during the review; ask the team for it if you want the detail.
