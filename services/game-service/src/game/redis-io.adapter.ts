import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type { ServerOptions, Server } from 'socket.io';

import { RedisService } from '../redis/redis.service';

/**
 * Socket.IO adapter backed by Redis pub/sub so that broadcasts are delivered to
 * clients connected to any game-service instance (horizontal scaling).
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly redisAdapter: ReturnType<typeof createAdapter>;

  constructor(app: INestApplicationContext) {
    super(app);
    const redis = app.get(RedisService);
    this.redisAdapter = createAdapter(redis.pub, redis.sub);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server: Server = super.createIOServer(port, options);
    server.adapter(this.redisAdapter);
    return server;
  }
}
