import { Module } from '@nestjs/common';

import { UserClientModule } from '../user-client/user-client.module';
import { SupabaseJwtService } from './supabase-jwt.service';
import { WsAuthMiddleware } from './ws-auth.middleware';

@Module({
  imports: [UserClientModule],
  providers: [SupabaseJwtService, WsAuthMiddleware],
  exports: [SupabaseJwtService, WsAuthMiddleware],
})
export class AuthModule {}
