import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parse as parseCookie } from 'cookie';
import type { Socket } from 'socket.io';

import type { AuthenticatedUser } from './authenticated-user';
import { SupabaseJwtService } from './supabase-jwt.service';

type SocketMiddleware = (socket: Socket, next: (err?: Error) => void) => void;

/**
 * Socket.IO handshake middleware that guards the HOST namespace with the
 * same Supabase JWT used by user-service. The token is read from the
 * `access_token` cookie sent on the WebSocket upgrade request (with fallbacks to
 * a Socket.IO `auth.token` payload or an `Authorization: Bearer` header for
 * native clients that can't set cookies).
 *
 * On success the authenticated user is attached to `socket.data.user`. On
 * failure the handshake is rejected and the socket never connects.
 */
@Injectable()
export class WsAuthMiddleware {
  private readonly logger = new Logger(WsAuthMiddleware.name);
  private readonly cookieName: string;
  private readonly enabled: boolean;

  constructor(
    private readonly jwtService: SupabaseJwtService,
    config: ConfigService,
  ) {
    this.cookieName = config.getOrThrow<string>('auth.cookieName');
    this.enabled = config.getOrThrow<boolean>('auth.hostAuthEnabled');
    if (!this.enabled) {
      this.logger.warn(
        'HOST_AUTH_ENABLED=false — the host WebSocket namespace is UNAUTHENTICATED. Do not use this in production.',
      );
    }
  }

  /** Returns a middleware to register via `namespace.use(...)`. */
  create(): SocketMiddleware {
    return (socket, next) => {
      if (!this.enabled) {
        next();
        return;
      }
      const token = this.extractToken(socket);
      if (!token) {
        next(new Error('Unauthorized: missing authentication token'));
        return;
      }
      this.jwtService
        .verify(token)
        .then((claims) => {
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
