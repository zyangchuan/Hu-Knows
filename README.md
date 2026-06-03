# Hu Knows

- **frontend** — Next.js 15 (App Router) + Tailwind CSS
- **services/user-service** — NestJS user-service (HTTP + gRPC) backed by Supabase Postgres
- **nginx** — reverse proxy that fronts everything on port **80**

```
Browser ──▶ nginx :80 ──┬─▶ /                    frontend  (Next.js :3000)
                        ├─▶ /api/user-service/   user-service HTTP (:8000)
                        └─▶ /docs                user-service Swagger UI

other services ──▶ user-service gRPC (:50051)   # internal, not via nginx
```

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2
- A [Supabase](https://supabase.com) project (for auth + Postgres)
- Optional, for running a service outside Docker: Node.js 22+

## 1. Configure environment

Supabase config lives in `.env` at the repo root (consumed by `user-service`).
Copy the example and fill in your project's values:

```bash
cp .env.example .env
```

Fill these from your Supabase dashboard:

| Variable | Where to find it | Notes |
|---|---|---|
| `SUPABASE_URL` | Project Settings → API | e.g. `https://<ref>.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Project Settings → API Keys | `sb_publishable_...` (client-safe) |
| `SUPABASE_SECRET_KEY` | Project Settings → API Keys | `sb_secret_...` (server-only) |
| `DATABASE_URL` | Project Settings → Database → **Connection pooling** | use the IPv4 pooler URI (see note below) |
| `SUPABASE_JWT_SECRET` | Project Settings → API → JWT Settings → JWT Secret | verifies user tokens (HS256) |
| `DATABASE_SSL` | — | `true` for Supabase |
| `SUPABASE_JWT_AUDIENCE` | — | defaults to `authenticated` |

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

**JWT verification.** User access tokens are verified with the project's shared
JWT secret (`SUPABASE_JWT_SECRET`, HS256).

> `.env` holds real secrets — keep it out of version control. Commit only
> `.env.example`.

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
| http://localhost/api/user-service/health | Service health check |
| http://localhost/docs | OpenAPI / Swagger UI |

Both the frontend and the user-service run in watch mode — editing files under
`frontend/` or `services/user-service/src/` hot-reloads inside the containers.

### Logs

Follow the logs of a single service (`frontend`, `user-service`, or
`reverse-proxy`):

```bash
docker compose logs -f user-service
```

Omit the service name to stream logs from all of them:

```bash
docker compose logs -f
```

Stop and remove the containers with `docker compose down`.

To build the production-oriented base config instead (no dev overrides), run
Compose without the dev file:

```bash
docker compose up --build
```

## API

The user-service is documented interactively at **http://localhost/docs**; the raw
OpenAPI spec is at **http://localhost/docs-json**.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/user-service/users` | — | Create a user profile |
| `GET` | `/api/user-service/users/me` | Bearer (Supabase JWT) | Get the authenticated user's profile |

For `/users/me`, click **Authorize** in Swagger UI and paste a Supabase user
access token.

### gRPC

The user-service also exposes a gRPC interface on port **50051** (internal to the
Compose network), defined in
[`services/user-service/proto/user.proto`](services/user-service/proto/user.proto):

```
package userservice;
service UserProfiles {
  rpc GetUserBySupabaseId(GetUserBySupabaseIdRequest) returns (UserProfile);
}
```

Call it from another service at `user-service:50051`.

## Running a service on its own (optional)

**Frontend**

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

**user-service** (needs a reachable Postgres and the env vars from `.env`)

```bash
cd services/user-service
npm install
# export the variables from ../../.env first, then:
npm run start:dev    # http://localhost:8000  (docs at /docs)
```

## Project layout

```
.
├── docker-compose.yml          # base stack (frontend + user-service + nginx)
├── docker-compose.dev.yml      # dev overrides (pass with -f)
├── .env / .env.example
├── frontend/               # Next.js + Tailwind
├── nginx/                  # reverse proxy config
└── services/
    └── user-service/       # NestJS (HTTP + gRPC)
```
