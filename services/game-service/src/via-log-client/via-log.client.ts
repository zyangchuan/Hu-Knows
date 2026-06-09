import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { VIA_LOG_PACKAGE, ViaLogGrpc, ViaMinutes } from './via-log.types';

/**
 * Thin wrapper over the via-log-service `ViaLog` gRPC service. Used to credit a
 * volunteer's VIA minutes when a game ends.
 */
@Injectable()
export class ViaLogClient implements OnModuleInit {
  private viaLog: ViaLogGrpc;

  constructor(@Inject(VIA_LOG_PACKAGE) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.viaLog = this.client.getService<ViaLogGrpc>('ViaLog');
  }

  /** Add `minutes` (>= 0) to a user's VIA total; returns the new total. */
  addViaMinutes(supabaseUserId: string, minutes: number): Promise<ViaMinutes> {
    return firstValueFrom(
      this.viaLog.AddViaMinutes({ supabase_user_id: supabaseUserId, minutes }),
    );
  }
}
