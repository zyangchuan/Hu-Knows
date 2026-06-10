import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

// Last-resort backstop: a demo must never go dark. A stray error in a timer
// callback (bot turn, claim window) must not take the process down.
process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('[game-service-demo-learn] uncaughtException (kept alive):', err);
});
process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('[game-service-demo-learn] unhandledRejection (kept alive):', reason);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // HTTP routes (e.g. health) live under this prefix; the WebSocket gateway
  // path is set on each gateway. This is the guided-LEARN instance — its own
  // path so it never collides with the demo or production game-service.
  app.setGlobalPrefix('api/game-service-demo-learn');
  // No Redis adapter: the demo is a single self-contained container using the
  // default in-memory Socket.IO adapter (state is in-memory, lasts for a game).
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 8000, '0.0.0.0');
}

bootstrap();
