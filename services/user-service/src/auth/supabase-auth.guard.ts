import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SupabaseJwtService } from './supabase-jwt.service';

/**
 * Route guard that requires a valid Supabase JWT, read from the auth cookie
 * (configurable via AUTH_COOKIE_NAME). On success it attaches the authenticated
 * user to `request.user` for the `@CurrentUser()` decorator.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly cookieName: string;

  constructor(
    private readonly jwtService: SupabaseJwtService,
    config: ConfigService,
  ) {
    this.cookieName = config.getOrThrow<string>('auth.cookieName');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token: string | undefined = request.cookies?.[this.cookieName];

    if (!token) {
      throw new UnauthorizedException('Missing authentication cookie');
    }

    const claims = await this.jwtService.verify(token);
    if (!claims.sub) {
      throw new UnauthorizedException('Token is missing the `sub` claim');
    }

    request.user = {
      supabaseUserId: claims.sub,
      email: typeof claims.email === 'string' ? claims.email : undefined,
      claims,
    };
    return true;
  }
}
