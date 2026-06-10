import {
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * Hello-world WebSocket gateway (Socket.IO).
 *
 * Clients connect at `path` and:
 *  - receive a `hello` event with "Hello world!" on connection
 *  - can emit a `hello` event and get "Hello world!" echoed back
 */
@WebSocketGateway({
  path: '/api/game-service/socket.io',
  cors: { origin: '*' },
})
export class GameGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    client.emit('hello', 'Hello world!');
  }

  @SubscribeMessage('hello')
  handleHello(@MessageBody() _data: unknown) {
    return { event: 'hello', data: 'Hello world!' };
  }
}
