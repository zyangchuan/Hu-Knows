import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';

import { WsAuthMiddleware } from '../auth/ws-auth.middleware';
import { ORGANISER_ROLE } from '../user-client/user-profile.types';
import { GameService } from './game.service';
import type { ClientMessage } from './engine/protocol';

/**
 * HOST WebSocket — the shared table device.
 *
 * Socket.IO namespace `/host` on path `/api/game-service/socket.io`. The host
 * creates rooms and drives the lobby; it sends no game moves. The handshake is
 * gated by the Supabase JWT auth middleware and requires an organiser. The
 * handshake `auth` carries a stable `clientId` (required) and an optional
 * `roomCode`; when a `roomCode` is present the game state is replayed on connect.
 *
 * Accepts (C→S): CREATE_ROOM, ADD_BOT, START_GAME, RESUME.
 * See GAME_MECHANIC_BRIEF.md §7–8.
 */
@WebSocketGateway({
  namespace: 'host',
  path: '/api/game-service/socket.io',
  cors: { origin: '*', credentials: true },
})
export class HostGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(HostGateway.name);

  constructor(
    private readonly games: GameService,
    private readonly wsAuth: WsAuthMiddleware,
  ) {}

  afterInit(server: Namespace): void {
    // The host (shared table) must be an authenticated organiser.
    server.use(this.wsAuth.create(ORGANISER_ROLE));
  }

  handleConnection(client: Socket): void {
    const auth = client.handshake.auth as
      | { clientId?: unknown; roomCode?: unknown }
      | undefined;
    const clientId = auth?.clientId;
    if (typeof clientId !== 'string' || !clientId) {
      this.logger.warn(`Host ${client.id} rejected: missing clientId`);
      client.emit('message', { type: 'ERROR', message: 'Missing clientId' });
      client.disconnect(true);
      return;
    }
    client.data.clientId = clientId;
    this.games.registerClient(client);
    this.logger.log(`Host connected: ${client.id} (clientId=${clientId})`);

    // Re-entering an existing table → replay its state on connection.
    const roomCode = auth?.roomCode;
    if (typeof roomCode === 'string' && roomCode) {
      client.data.roomCode = roomCode;
      void this.games.attachHost(client.id, roomCode);
    }
  }

  handleDisconnect(client: Socket): void {
    this.games.removeClient(client.id);
    this.logger.log(`Host disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() msg: ClientMessage,
    @ConnectedSocket() client: Socket,
  ): void {
    void this.games.dispatch(client.id, msg, 'host');
  }
}
