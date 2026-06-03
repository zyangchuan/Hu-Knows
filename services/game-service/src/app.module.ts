import { Module } from '@nestjs/common';

import { GameGateway } from './game/game.gateway';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  providers: [GameGateway],
})
export class AppModule {}
