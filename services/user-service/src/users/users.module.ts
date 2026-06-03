import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { UserProfile } from './user-profile.entity';
import { UsersController } from './users.controller';
import { UsersGrpcController } from './users.grpc.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserProfile]), AuthModule],
  controllers: [UsersController, UsersGrpcController],
  providers: [UsersService],
})
export class UsersModule {}
