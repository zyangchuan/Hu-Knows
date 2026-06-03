import { join } from 'path';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Mirrors the previous FastAPI route prefix.
  app.setGlobalPrefix('api/user-service');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // OpenAPI docs + Swagger UI at /docs (documented paths include the prefix).
  const swaggerConfig = new DocumentBuilder()
    .setTitle('User Service API')
    .setDescription('User profile management for hu-knows')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
  });

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
