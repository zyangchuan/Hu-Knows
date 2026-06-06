import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';

import { ViaLogService } from './via-log.service';

interface AddViaMinutesRequest {
  supabase_user_id: string;
  minutes: number;
}

/** gRPC handlers for the ViaLog service (see proto/via-log.proto). */
@Controller()
export class ViaLogGrpcController {
  constructor(private readonly viaLog: ViaLogService) {}

  @GrpcMethod('ViaLog', 'AddViaMinutes')
  async addViaMinutes(data: AddViaMinutesRequest) {
    if (!data.supabase_user_id) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'supabase_user_id is required',
      });
    }
    if (!Number.isInteger(data.minutes) || data.minutes < 0) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'minutes must be a non-negative integer',
      });
    }

    const result = await this.viaLog.addMinutes(
      data.supabase_user_id,
      data.minutes,
    );
    return {
      supabase_user_id: result.user_id,
      via_minutes: result.via_minutes,
    };
  }
}
