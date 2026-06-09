import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parse as parseCookie } from 'cookie';
import type { Socket } from 'socket.io';

import { UserServiceClient } from '../user-client/user-service.client';
import type { GrpcUserProfile } from '../user-client/user-profile.types';
import type { AuthenticatedUser } from './authenticated-user';
import { SupabaseJwtService } from './supabase-jwt.service';

type SocketMiddleware = (socket: Socket, next: (err?: Error) => void) => void;

/**
 * Socket.IO handshake middleware that guards a game-service namespace with the
 * same Supabase JWT used by user-service. The token is read from the
 * `access_token` cookie sent on the WebSocket upgrade request (with fallbacks to
 * a Socket.IO `auth.token` payload or an `Authorization: Bearer` header for
 * native clients that can't set cookies).
 *
 * Optionally requires a specific role (`organiser` for /host, `volunteer` for
 * /play). The role lives in user_profiles, so it is resolved via user-service
 * gRPC and the handshake is rejected if it doesn't match.
 *
 * On success the authenticated user is attached to `socket.data.user` (and the
 * profile to `socket.data.profile`); on failure the handshake is rejected and
 * the socket never connects.
 */
@Injectable()
export class WsAuthMiddleware {
  private readonly cookieName: string;

  constructor(
    private readonly jwtService: SupabaseJwtService,
    private readonly userClient: UserServiceClient,
    config: ConfigService,
  ) {
    this.cookieName = config.getOrThrow<string>('auth.cookieName');
  }

  /**
   * Returns a middleware to register via `namespace.use(...)`. When
   * `requiredRole` is given (proto enum name, e.g. 'ORGANISER'/'VOLUNTEER'), the
   * caller's user-service profile must have that role.
   */
  create(requiredRole?: string): SocketMiddleware {
    return (socket, next) => {
      const token = this.extractToken(socket);
      if (!token) {
        next(new Error('Unauthorized: missing authentication token'));
        return;
      }
      this.jwtService
        .verify(token)
        .then(async (claims) => {
          if (!claims.sub) {
            next(new Error('Unauthorized: token is missing the `sub` claim'));
            return;
          }
          const user: AuthenticatedUser = {
            supabaseUserId: claims.sub,
            email: typeof claims.email === 'string' ? claims.email : undefined,
            claims,
          };
          (socket.data as { user?: AuthenticatedUser }).user = user;

          if (requiredRole) {
            let profile: GrpcUserProfile;
            try {
              profile = await this.userClient.getUserBySupabaseId(claims.sub);
            } catch {
              next(new Error('Unauthorized: could not resolve user role'));
              return;
            }
            if (profile.role !== requiredRole) {
              next(new Error(`Forbidden: ${requiredRole.toLowerCase()} role required`));
              return;
            }
            (socket.data as { profile?: GrpcUserProfile }).profile = profile;
          }
          next();
        })
        .catch(() => next(new Error('Unauthorized: invalid authentication token')));
    };
  }

  private extractToken(socket: Socket): string | undefined {
    // 1) Cookie on the upgrade request (browser host client — matches user-service).
    const cookieHeader = socket.handshake.headers.cookie;
    if (cookieHeader) {
      const token = parseCookie(cookieHeader)[this.cookieName];
      if (token) return token;
    }
    // 2) Socket.IO auth payload: io(url, { auth: { token } }).
    const authToken = (socket.handshake.auth as { token?: unknown } | undefined)?.token;
    if (typeof authToken === 'string' && authToken) return authToken;
    // 3) Authorization: Bearer <token> header.
    const authHeader = socket.handshake.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) return authHeader.slice('Bearer '.length);
    return undefined;
  }
}
