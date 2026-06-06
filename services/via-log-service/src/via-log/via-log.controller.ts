import { Controller, Get, UseGuards } from '@nestjs/common';

import { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { VolunteerGuard } from './volunteer.guard';
import { ViaLogService } from './via-log.service';

// Volunteers only: a valid JWT (SupabaseAuthGuard) AND volunteer role
// (VolunteerGuard, which resolves the role via user-service gRPC).
@Controller('via-logs')
@UseGuards(SupabaseAuthGuard, VolunteerGuard)
export class ViaLogController {
  constructor(private readonly viaLog: ViaLogService) {}

  @Get('me')
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.viaLog.getTotalForUser(user.supabaseUserId);
  }
}
