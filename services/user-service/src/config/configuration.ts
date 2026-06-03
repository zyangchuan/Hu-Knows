export default () => ({
  port: parseInt(process.env.PORT ?? '8000', 10),
  grpc: {
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
});
