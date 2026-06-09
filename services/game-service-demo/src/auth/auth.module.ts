import { Module } from '@nestjs/common';

import { SupabaseJwtService } from './supabase-jwt.service';
import { WsAuthMiddleware } from './ws-auth.middleware';

@Module({
  providers: [SupabaseJwtService, WsAuthMiddleware],
  exports: [SupabaseJwtService, WsAuthMiddleware],
})
export class AuthModule {}
