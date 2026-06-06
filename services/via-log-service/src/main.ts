import { join } from 'path';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/via-log-service');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // gRPC interface (alongside the HTTP API). This service is BOTH a gRPC client
  // of user-service and a gRPC server exposing the ViaLog service.
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.GRPC,
      options: {
        package: 'vialogservice',
        protoPath: join(__dirname, '..', 'proto', 'via-log.proto'),
        url: config.get<string>('grpc.url'),
        // Keep snake_case field names from the .proto contract.
        loader: { keepCase: true },
      },
    },
    { inheritAppConfig: true },
  );

  await app.startAllMicroservices();
  await app.listen(config.getOrThrow<number>('port'), '0.0.0.0');
}

bootstrap();
