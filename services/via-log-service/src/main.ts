import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/via-log-service');
  await app.listen(process.env.PORT ?? 8000, '0.0.0.0');
}

bootstrap();
