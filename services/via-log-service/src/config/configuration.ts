export default () => ({
  port: parseInt(process.env.PORT ?? '8000', 10),
  grpc: {
    // Address this service's own gRPC server binds to.
    url: process.env.GRPC_URL ?? '0.0.0.0:50051',
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
    ssl: (process.env.DATABASE_SSL ?? 'true').toLowerCase() === 'true',
  },
  supabase: {
    url: process.env.SUPABASE_URL ?? '',
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY ?? '',
    secretKey: process.env.SUPABASE_SECRET_KEY ?? '',
    // JWT verification: shared HS256 secret (Supabase project JWT secret).
    jwtSecret: process.env.SUPABASE_JWT_SECRET ?? '',
    jwtAudience: process.env.SUPABASE_JWT_AUDIENCE ?? 'authenticated',
  },
  auth: {
    // Name of the cookie carrying the JWT access token.
    cookieName: process.env.AUTH_COOKIE_NAME ?? 'access_token',
  },
  userService: {
    // user-service gRPC endpoint; via-log-service is a client (no gRPC server).
    grpcUrl: process.env.USER_SERVICE_GRPC_URL ?? 'user-service:50051',
  },
});
