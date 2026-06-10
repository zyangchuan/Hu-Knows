# Hu Knows · Repo-wide guide

Working notes and rules for anyone (human or AI) working anywhere in this repo.
These apply to the **whole Hu Knows monorepo**, not just the frontend.

> New here? Read `HANDOVER.md` first: it summarises the latest changes (the Pung/Chi
> educational pause, the soft-lock fix), how to run and test, and the open items.

## Monorepo layout

A Dockerised monorepo fronted by nginx on port 80. See `README.md` for setup,
env vars, and the full request/gRPC topology.

- `frontend/` Next.js 15 (App Router) + Tailwind. Three entry modes: `/demo` (open
  hackathon demo of the full flow on game-service-demo), `/app` (auth-gated production
  on game-service), and `/<variant>/learn` (interactive Pung/Chi/Hu tutorial). See
  `frontend/CLAUDE.md` for the frontend-specific plan, file map, and status.
- `services/user-service/` NestJS (HTTP + gRPC) backed by Supabase Postgres.
- `services/game-service/` NestJS server-authoritative Mahjong over Socket.IO,
  Redis-backed.
- `services/game-service-demo/` in-memory, no-auth copy of game-service for `/demo`.
- `services/via-log-service/` NestJS VIA-minutes service (HTTP + gRPC).
- `docs/` aggregated OpenAPI / Swagger UI. `nginx/` reverse proxy config.
- `GAME_MECHANIC_BRIEF.md` authoritative game design.

## Project style rules

These apply to all new and edited content from now on, in every part of the repo.

- **No em-dashes.** Never use the em-dash character (the long dash) anywhere: code,
  comments, UI copy, commit messages, or docs. Use a comma, a colon, parentheses,
  or a period instead. A normal hyphen is fine.
- **Serif typeface for the UI.** The frontend uses a serif font (Source Serif 4) as
  its primary typeface, not the generic sans-serif defaults. Keep JetBrains Mono for
  tile numbers. Do not reintroduce Inter or similar default sans fonts for body copy.

## Correctness over shortcuts

Solve the general problem, not just the case in front of you. A shortcut that
"works for this input" but breaks the contract is a bug, not a solution.

- **No shortcuts that affect functionality.** Do not special-case, stub, or fake a
  result to make one scenario pass. The implementation must hold for every valid
  input the function or component can actually receive, not just the example at hand.
- **No hardcoding.** Never hardcode values that should be derived, computed, looked
  up, or passed in: IDs, indices, counts, seat numbers, room codes, tile data, magic
  numbers, paths, URLs, or test-specific answers. Read them from the real source
  (state, config, env, arguments, the data model). If a constant is genuinely fixed
  by the design, name it and put it with the other constants, do not inline it.
- **Handle the edge cases, do not skip them.** Think through empty, zero, one, many,
  duplicate, out-of-range, concurrent, and failure inputs. Name the ones you are not
  handling and why, rather than silently ignoring them.
- **Respect the existing contract.** Match the types, message protocol, and game
  rules already defined (`lib/types.ts`, `lib/rules.ts`, the Game Mechanic Brief, the
  service protos). Do not loosen a type or weaken a check to get something to compile.
- **If a shortcut is truly the right call,** say so explicitly and explain the
  tradeoff. Do not bury it.

## Coding guidelines (Karpathy)

Behavioral guidelines to reduce common LLM coding mistakes. Merge with
project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks,
use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work")
require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer
rewrites due to overcomplication, and clarifying questions come before
implementation rather than after mistakes.
