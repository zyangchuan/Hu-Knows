import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { RedisIoAdapter } from './game/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // HTTP routes (e.g. health) live under this prefix. The WebSocket gateway
  // path is configured separately on the gateway itself.
  app.setGlobalPrefix('api/game-service');
  // Redis-backed Socket.IO adapter so broadcasts reach sockets on any instance.
  app.useWebSocketAdapter(new RedisIoAdapter(app));
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 8000, '0.0.0.0');
}

bootstrap();
