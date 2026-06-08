import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

/**
 * Verifies Supabase user access tokens.
 *
 * Supabase now signs access tokens with an asymmetric key (ES256) published at
 * the project's JWKS endpoint, so we verify against that. The legacy HS256
 * shared secret (SUPABASE_JWT_SECRET) is still accepted as a fallback, so the
 * guard keeps working if the project is ever switched back to HMAC signing.
 */
@Injectable()
export class SupabaseJwtService {
  private readonly jwks?: ReturnType<typeof createRemoteJWKSet>;
  private readonly secret?: Uint8Array;
  private readonly audience: string;

  constructor(config: ConfigService) {
    const url = config.get<string>('supabase.url');
    if (url) {
      this.jwks = createRemoteJWKSet(
        new URL(`${url.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`),
      );
    }
    const secret = config.get<string>('supabase.jwtSecret');
    if (secret) {
      this.secret = new TextEncoder().encode(secret);
    }
    this.audience = config.getOrThrow<string>('supabase.jwtAudience');
  }

  async verify(token: string): Promise<JWTPayload> {
    // 1) Asymmetric (ES256/RS256) via JWKS — the current Supabase default.
    if (this.jwks) {
      try {
        const { payload } = await jwtVerify(token, this.jwks, {
          audience: this.audience,
          algorithms: ['ES256', 'RS256'],
        });
        return payload;
      } catch {
        // fall through to the legacy HS256 path
      }
    }
    // 2) Legacy HS256 shared secret.
    if (this.secret) {
      try {
        const { payload } = await jwtVerify(token, this.secret, {
          audience: this.audience,
          algorithms: ['HS256'],
        });
        return payload;
      } catch {
        // fall through to the error below
      }
    }
    throw new UnauthorizedException('Invalid authentication token');
  }
}
