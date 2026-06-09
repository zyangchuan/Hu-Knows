import { Injectable, Logger } from '@nestjs/common';

/**
 * In-memory key/value store with the small ioredis-compatible surface the game
 * uses (`get` / `set` with optional `EX` TTL / `del` / `exists`).
 *
 * This is the DEMO game-service — state lives only in this process, so a restart
 * wipes active games ("just lasts for a game"). No Redis, no Socket.IO Redis
 * adapter (the default in-memory adapter is used), so the demo runs as a single
 * self-contained container. The full `game-service` keeps the real Redis-backed
 * store for production.
 */
class InMemoryKV {
  private readonly store = new Map<string, string>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  async get(key: string): Promise<string | null> {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  /** Mirrors `redis.set(key, val, 'EX', seconds)`; the mode/ttl are optional. */
  async set(key: string, val: string, mode?: string, ttl?: number): Promise<'OK'> {
    this.store.set(key, val);
    const existing = this.timers.get(key);
    if (existing) clearTimeout(existing);
    this.timers.delete(key);
    if (mode === 'EX' && typeof ttl === 'number' && ttl > 0) {
      const t = setTimeout(() => {
        this.store.delete(key);
        this.timers.delete(key);
      }, ttl * 1000);
      // Don't keep the event loop alive for a GC backstop timer.
      (t as { unref?: () => void }).unref?.();
      this.timers.set(key, t);
    }
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const had = this.store.delete(key);
    const t = this.timers.get(key);
    if (t) clearTimeout(t);
    this.timers.delete(key);
    return had ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    return this.store.has(key) ? 1 : 0;
  }
}

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  /** Game/session state store. In the demo this is in-memory (no Redis). */
  readonly main = new InMemoryKV();

  constructor() {
    this.logger.warn(
      'DEMO game-service: state is IN-MEMORY (no Redis). A restart clears active games.',
    );
  }
}
