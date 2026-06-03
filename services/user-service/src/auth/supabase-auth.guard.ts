import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { SupabaseJwtService } from './supabase-jwt.service';

/**
 * Route guard that requires a valid Supabase JWT. On success it attaches the
 * authenticated user to `request.user` for the `@CurrentUser()` decorator.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly jwtService: SupabaseJwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }

    const token = header.slice('Bearer '.length).trim();
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
