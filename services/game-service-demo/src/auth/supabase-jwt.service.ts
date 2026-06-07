import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify, type JWTPayload } from 'jose';

/**
 * Verifies Supabase user access tokens using the project's shared JWT secret
 * (HS256). Configure it via `SUPABASE_JWT_SECRET`
 * (Project Settings > API > JWT Settings > JWT Secret).
 *
 * Shared with user-service so the same access_token cookie authenticates the
 * host WebSocket connection.
 */
@Injectable()
export class SupabaseJwtService {
  private readonly secret?: Uint8Array;
  private readonly audience: string;

  constructor(config: ConfigService) {
    const secret = config.get<string>('supabase.jwtSecret');
    if (secret) {
      this.secret = new TextEncoder().encode(secret);
    }
    this.audience = config.getOrThrow<string>('supabase.jwtAudience');
  }

  async verify(token: string): Promise<JWTPayload> {
    if (!this.secret) {
      throw new InternalServerErrorException(
        'SUPABASE_JWT_SECRET is not configured',
      );
    }
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        audience: this.audience,
        algorithms: ['HS256'],
      });
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}
