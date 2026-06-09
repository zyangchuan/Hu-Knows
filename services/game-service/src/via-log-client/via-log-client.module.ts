import { join } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { ViaLogClient } from './via-log.client';
import { VIA_LOG_PACKAGE } from './via-log.types';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: VIA_LOG_PACKAGE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'vialogservice',
            // Compiled file lives at dist/via-log-client/, so go up two levels to /app/proto.
            protoPath: join(__dirname, '..', '..', 'proto', 'via-log.proto'),
            url: config.get<string>('viaLogService.grpcUrl'),
            loader: { keepCase: true },
          },
        }),
      },
    ]),
  ],
  providers: [ViaLogClient],
  exports: [ViaLogClient],
})
export class ViaLogClientModule {}
