import { join } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { UserServiceClient } from './user-service.client';
import { USER_SERVICE_PACKAGE } from './user-profile.types';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: USER_SERVICE_PACKAGE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'userservice',
            // Compiled file lives at dist/user-client/, so go up two levels to /app/proto.
            protoPath: join(__dirname, '..', '..', 'proto', 'user.proto'),
            url: config.get<string>('userService.grpcUrl'),
            // Keep snake_case field names from the .proto contract, and decode
            // the Role enum as its name string ('VOLUNTEER'/'ORGANISER') rather
            // than its numeric tag, so role checks compare against names.
            loader: { keepCase: true, enums: String },
          },
        }),
      },
    ]),
  ],
  providers: [UserServiceClient],
  exports: [UserServiceClient],
})
export class UserClientModule {}
