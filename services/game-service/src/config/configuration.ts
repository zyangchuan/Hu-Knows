export default () => ({
  port: parseInt(process.env.PORT ?? '8000', 10),
  redis: {
    // Durable store for game/session state + Socket.IO adapter pub/sub.
    url: process.env.REDIS_URL ?? 'redis://game-redis:6379',
  },
  supabase: {
    // JWT verification: shared HS256 secret (Supabase project JWT secret).
    jwtSecret: process.env.SUPABASE_JWT_SECRET ?? '',
    jwtAudience: process.env.SUPABASE_JWT_AUDIENCE ?? 'authenticated',
  },
  auth: {
    // Name of the cookie carrying the JWT access token (shared with user-service).
    cookieName: process.env.AUTH_COOKIE_NAME ?? 'access_token',
    // The host WebSocket namespace is auth-gated by default. Set
    // HOST_AUTH_ENABLED=false only for local dev without Supabase configured.
    hostAuthEnabled: (process.env.HOST_AUTH_ENABLED ?? 'true').toLowerCase() !== 'false',
  },
});
