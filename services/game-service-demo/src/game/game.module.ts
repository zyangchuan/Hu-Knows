import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { GameService } from './game.service';
import { HostGateway } from './host.gateway';
import { PlayerGateway } from './player.gateway';

@Module({
  imports: [AuthModule],
  providers: [GameService, HostGateway, PlayerGateway],
})
export class GameModule {}
