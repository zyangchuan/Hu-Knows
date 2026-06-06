import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { UserClientModule } from '../user-client/user-client.module';
import { ViaLog } from './via-log.entity';
import { ViaLogController } from './via-log.controller';
import { ViaLogGrpcController } from './via-log.grpc.controller';
import { ViaLogService } from './via-log.service';
import { VolunteerGuard } from './volunteer.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ViaLog]),
    AuthModule,
    UserClientModule,
  ],
  controllers: [ViaLogController, ViaLogGrpcController],
  providers: [ViaLogService, VolunteerGuard],
})
export class ViaLogModule {}
