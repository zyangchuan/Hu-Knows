import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Owns the ioredis connections for the game-service: a `main` client for
 * game/session state, and a `pub`/`sub` pair for the Socket.IO Redis adapter
 * (cross-instance broadcasts). All three are closed on shutdown.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly main: Redis;
  readonly pub: Redis;
  readonly sub: Redis;

  constructor(config: ConfigService) {
    const url = config.getOrThrow<string>('redis.url');
    this.main = new Redis(url, { lazyConnect: false });
    this.pub = new Redis(url, { lazyConnect: false });
    this.sub = this.pub.duplicate();
    for (const [name, client] of [
      ['main', this.main],
      ['pub', this.pub],
      ['sub', this.sub],
    ] as const) {
      client.on('error', (err) =>
        this.logger.error(`Redis ${name} error: ${err.message}`),
      );
    }
  }

  onModuleInit(): void {
    this.logger.log('Redis clients initialised');
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([
      this.main.quit(),
      this.pub.quit(),
      this.sub.quit(),
    ]);
  }
}
