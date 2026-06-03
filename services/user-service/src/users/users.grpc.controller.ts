import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';

import { UsersService } from './users.service';

interface GetUserBySupabaseIdRequest {
  supabase_user_id: string;
}

/** gRPC handlers for the UserProfiles service (see proto/user.proto). */
@Controller()
export class UsersGrpcController {
  constructor(private readonly users: UsersService) {}

  @GrpcMethod('UserProfiles', 'GetUserBySupabaseId')
  async getUserBySupabaseId(data: GetUserBySupabaseIdRequest) {
    const user = await this.users.findEntityBySupabaseUserId(data.supabase_user_id);
    if (!user) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'User profile not found',
      });
    }
    return {
      id: user.id,
      supabase_user_id: user.supabaseUserId,
      name: user.name,
      email: user.email,
      created_at: user.createdAt.toISOString(),
    };
  }
}
