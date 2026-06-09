# Hu Knows

- **frontend** — Next.js 15 (App Router) + Tailwind CSS
- **services/user-service** — NestJS user-service (HTTP + gRPC) backed by Supabase Postgres
- **services/game-service** — NestJS server-authoritative Mahjong over WebSocket (Socket.IO), Redis-backed
- **services/game-service-demo** — in-memory, no-auth copy of game-service for the `/demo` flow
- **services/via-log-service** — NestJS VIA-minutes service (HTTP + gRPC) backed by Supabase Postgres
- **game-redis** — Redis store for game-service room/session state (`redis:7-alpine`)
- **docs** — aggregated OpenAPI / Swagger UI for all services
- **nginx** — reverse proxy that fronts everything on port **80**

```
Browser ──▶ nginx :80 ──┬─▶ /                       frontend  (Next.js :3000)
                        ├─▶ /api/user-service/      user-service HTTP (:8000)
                        ├─▶ /api/game-service       game-service WebSocket (Socket.IO, :8000)
                        ├─▶ /api/game-service-demo  game-service-demo WebSocket (:8000)
                        ├─▶ /api/via-log-service/   via-log-service HTTP (:8000)
                        └─▶ /docs                   Swagger UI aggregator (docs)

internal gRPC (not via nginx):
  game-service     ─▶ user-service :50051       # resolve role for WebSocket auth
  game-service     ─▶ via-log-service :50051    # credit VIA minutes on game over
  via-log-service  ─▶ user-service :50051       # role check
game-service       ─▶ game-redis :6379          # room/session state
```

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2
- A [Supabase](https://supabase.com) project (for auth + Postgres)

## 1. Configure environment

Configuration lives in `.env.dev` at the repo root and is shared by all backend
services. Copy the example and fill in your project's values:

```bash
cp .env.dev.example .env.dev
```

Fill these from your Supabase dashboard:

| Variable | Where to find it | Notes |
|---|---|---|
| `SUPABASE_URL` | Project Settings → API | e.g. `https://<ref>.supabase.co`; also the JWKS source for token verification |
| `SUPABASE_PUBLISHABLE_KEY` | Project Settings → API Keys | `sb_publishable_...` (client-safe) |
| `SUPABASE_SECRET_KEY` | Project Settings → API Keys | `sb_secret_...` (server-only) |
| `DATABASE_URL` | Project Settings → Database → **Connection pooling** | use the IPv4 pooler URI (see note below) |
| `DATABASE_SSL` | — | `true` for Supabase |
| `SUPABASE_JWT_AUDIENCE` | — | defaults to `authenticated` |
| `AUTH_COOKIE_NAME` | — | cookie the services read the JWT from (default `access_token`) |

**Database connection — use the IPv4 pooler.** Supabase's direct host
(`db.<ref>.supabase.co`) is **IPv6-only**, which Docker and most networks can't
reach, so it will fail to connect. Use the IPv4 **connection pooler** (Supavisor)
instead — from Project Settings → Database → *Connection pooling*:

```
postgresql://postgres.<project-ref>:<password>@aws-<n>-<region>.pooler.supabase.com:5432/postgres
```

- The username must include the project ref: `postgres.<project-ref>`.
- Port `5432` is session mode (recommended for this long-running service); `6543`
  is transaction mode, which can hit prepared-statement errors with some ORMs.
- URL-encode any special characters in the password (e.g. `@` → `%40`).

**JWT verification.** Supabase signs access tokens with the project's asymmetric
**JWT Signing Key**; the services verify them against the project's JWKS endpoint
(`<SUPABASE_URL>/auth/v1/.well-known/jwks.json`). No shared secret is needed.

> `.env.dev` holds real secrets — keep it out of version control. Commit only
> `.env.dev.example`. Production secrets go in `.env.prod` (used with the prod
> overlay; see below).

## 2. Run the stack

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
```

This layers `docker-compose.dev.yml` on top of the base `docker-compose.yml`,
giving you the dev setup: `dev` image targets, source bind-mounts, and watch
mode. `-d` runs the stack detached (in the background).

Then open:

| URL | What |
|---|---|
| http://localhost | Frontend |
| http://localhost/api/user-service/health | user-service health check |
| http://localhost/api/game-service/health | game-service health check |
| http://localhost/api/via-log-service/health | via-log-service health check |
| http://localhost/docs | OpenAPI / Swagger UI |

The frontend and every NestJS service run in watch mode — editing files under
`frontend/` or `services/*/src/` hot-reloads inside the containers.

### Logs

Follow the logs of a single service (e.g. `frontend`, `user-service`,
`game-service`, `via-log-service`, `reverse-proxy`):

```bash
docker compose logs -f game-service
```

Omit the service name to stream logs from all of them:

```bash
docker compose logs -f
```

Stop and remove the containers with `docker compose down`.

To run the production-oriented config instead, layer the prod overlay (which uses
`runner` image targets and `.env.prod`):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

## API

All services are documented interactively at **http://localhost/docs** — a Swagger
UI that renders the OpenAPI spec checked in at
[`docs/openapi.yaml`](docs/openapi.yaml).

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/user-service/users` | — | Create a user profile |
| `GET` | `/api/user-service/users/me` | Bearer (Supabase JWT) | Get the authenticated user's profile |
| `GET` | `/api/via-log-service/via-logs/me` | Bearer (Supabase JWT, **volunteer**) | The volunteer's current total VIA minutes |

**game-service** is a real-time **Socket.IO** API (not REST): two namespaces on
`/api/game-service/socket.io` — `/host` (organiser) and `/play` (volunteer). The
full message protocol, handshake/auth, and session-recovery contract are documented
under the *game-service* tag in the OpenAPI docs. `game-service-demo` mirrors it on
`/api/game-service-demo` with no auth and in-memory state for the `/demo` flow.

For authenticated REST endpoints, click **Authorize** in Swagger UI and paste a
Supabase user access token.

### Updating the docs

The spec is a hand-maintained file — edit [`docs/openapi.yaml`](docs/openapi.yaml)
to document new endpoints or services, then rebuild the `docs` image. Since it's
not generated from the services, keep it in sync with the code when routes change.

### gRPC

Internal, service-to-service gRPC (on port **50051**, inside the Compose network —
not exposed via nginx):

- **user-service** — [`UserProfiles.GetUserBySupabaseId`](services/user-service/proto/user.proto)
  at `user-service:50051`. Called by game-service and via-log-service to resolve a
  user's profile/role.
- **via-log-service** — [`ViaLog.AddViaMinutes`](services/via-log-service/proto/via-log.proto)
  at `via-log-service:50051`. Called by game-service to credit a volunteer's VIA
  minutes when a game ends.

```
package userservice;
service UserProfiles {
  rpc GetUserBySupabaseId(GetUserBySupabaseIdRequest) returns (UserProfile);
}

package vialogservice;
service ViaLog {
  rpc AddViaMinutes(AddViaMinutesRequest) returns (ViaMinutes);
}
```

## Project layout

```
.
├── docker-compose.yml          # base stack
├── docker-compose.dev.yml      # dev overrides (pass with -f)
├── docker-compose.prod.yml     # prod overrides (pass with -f)
├── .env.dev / .env.dev.example / .env.prod.example
├── docs/                       # openapi.yaml + Swagger UI for all services
├── frontend/                   # Next.js + Tailwind
├── nginx/                      # reverse proxy config
└── services/
    ├── user-service/           # NestJS (HTTP + gRPC server)
    ├── game-service/           # NestJS (WebSocket; Redis-backed; gRPC client)
    ├── game-service-demo/      # in-memory, no-auth copy for the /demo flow
    └── via-log-service/        # NestJS (HTTP + gRPC server)
```
