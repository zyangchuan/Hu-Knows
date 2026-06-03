import { join } from 'path';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Mirrors the previous FastAPI route prefix.
  app.setGlobalPrefix('api/user-service');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // gRPC interface (alongside the HTTP API).
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.GRPC,
      options: {
        package: 'userservice',
        protoPath: join(__dirname, '..', 'proto', 'user.proto'),
        url: config.get<string>('grpc.url'),
        // Keep snake_case field names from the .proto contract.
        loader: { keepCase: true },
      },
    },
    { inheritAppConfig: true },
  );

  await app.startAllMicroservices();
  await app.listen(config.get<number>('port') ?? 8000, '0.0.0.0');
}

bootstrap();
