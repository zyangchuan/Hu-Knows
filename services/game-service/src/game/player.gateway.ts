import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import type { Socket } from 'socket.io';

import { GameService } from './game.service';
import type { ClientMessage } from './engine/protocol';

/**
 * PLAYER WebSocket — each phone (a youth+elder pair sharing one seat).
 *
 * Socket.IO namespace `/play` on path `/api/game-service/socket.io`. No auth:
 * players join a room with a 4-char code (the Kahoot-style join). A phone is a
 * thin renderer — it only ever sends two game actions. The handshake `auth`
 * carries a stable `clientId` (required) and an optional `roomCode`; when a
 * `roomCode` is present the current state (and the player's seat/hand, if any)
 * is replayed on connection.
 *
 * Accepts (C→S): JOIN_ROOM, DISCARD, CLAIM.
 * See GAME_MECHANIC_BRIEF.md §7–8.
 */
@WebSocketGateway({
  namespace: 'play',
  path: '/api/game-service/socket.io',
  cors: { origin: '*', credentials: true },
})
export class PlayerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(PlayerGateway.name);

  constructor(private readonly games: GameService) {}

  handleConnection(client: Socket): void {
    const auth = client.handshake.auth as
      | { clientId?: unknown; roomCode?: unknown }
      | undefined;
    const clientId = auth?.clientId;
    if (typeof clientId !== 'string' || !clientId) {
      this.logger.warn(`Player ${client.id} rejected: missing clientId`);
      client.emit('message', { type: 'ERROR', message: 'Missing clientId' });
      client.disconnect(true);
      return;
    }
    client.data.clientId = clientId;
    this.games.registerClient(client);
    this.logger.log(`Player connected: ${client.id} (clientId=${clientId})`);

    // Entering a room → replay current state (and reclaim the seat, if any).
    const roomCode = auth?.roomCode;
    if (typeof roomCode === 'string' && roomCode) {
      client.data.roomCode = roomCode;
      void this.games.attachPlayer(client.id, roomCode);
    }
  }

  handleDisconnect(client: Socket): void {
    this.games.removeClient(client.id);
    this.logger.log(`Player disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() msg: ClientMessage,
    @ConnectedSocket() client: Socket,
  ): void {
    void this.games.dispatch(client.id, msg, 'player');
  }
}
