import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // HTTP routes (e.g. health) live under this prefix. The WebSocket gateway
  // path is configured separately on the gateway itself.
  app.setGlobalPrefix('api/game-service');
  await app.listen(process.env.PORT ?? 8000, '0.0.0.0');
}

bootstrap();
