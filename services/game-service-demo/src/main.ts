import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

// Last-resort backstop: a demo must never go dark. A stray error in a timer
// callback (bot turn, claim window) must not take the process down.
process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('[game-service-demo] uncaughtException (kept alive):', err);
});
process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('[game-service-demo] unhandledRejection (kept alive):', reason);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // HTTP routes (e.g. health) live under this prefix; the WebSocket gateway
  // path is set on each gateway. This is the DEMO instance — separate path from
  // the production game-service so the two never collide.
  app.setGlobalPrefix('api/game-service-demo');
  // No Redis adapter: the demo is a single self-contained container using the
  // default in-memory Socket.IO adapter (state is in-memory, lasts for a game).
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 8000, '0.0.0.0');
}

bootstrap();
