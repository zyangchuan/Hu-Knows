export default () => ({
  port: parseInt(process.env.PORT ?? '8000', 10),
  redis: {
    // Durable store for game/session state + Socket.IO adapter pub/sub.
    url: process.env.REDIS_URL ?? 'redis://game-redis:6379',
  },
  supabase: {
    // Project URL — source of the JWKS used to verify access tokens (the project
    // signs with an asymmetric JWT Signing Key).
    url: process.env.SUPABASE_URL ?? '',
    // Legacy HS256 shared secret — accepted only as a fallback if still set.
    jwtSecret: process.env.SUPABASE_JWT_SECRET ?? '',
    jwtAudience: process.env.SUPABASE_JWT_AUDIENCE ?? 'authenticated',
  },
  auth: {
    // Name of the cookie carrying the JWT access token (shared with user-service).
    cookieName: process.env.AUTH_COOKIE_NAME ?? 'access_token',
  },
  userService: {
    // user-service gRPC endpoint (Docker Compose service name) — used to resolve
    // the caller's role for the host/player namespace auth.
    grpcUrl: 'user-service:50051',
  },
});
