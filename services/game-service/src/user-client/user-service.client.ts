import { status as GrpcStatus } from '@grpc/grpc-js';
import {
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import {
  GrpcUserProfile,
  USER_SERVICE_PACKAGE,
  UserProfilesGrpc,
} from './user-profile.types';

/**
 * Thin wrapper over the user-service `UserProfiles` gRPC service. This is the
 * ONLY way via-log-service obtains user profile / role data — it never
 * associates with the user_profiles table directly.
 */
@Injectable()
export class UserServiceClient implements OnModuleInit {
  private profiles: UserProfilesGrpc;

  constructor(
    @Inject(USER_SERVICE_PACKAGE) private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.profiles = this.client.getService<UserProfilesGrpc>('UserProfiles');
  }

  /**
   * Fetch a profile by Supabase user id. Translates gRPC NOT_FOUND into a Nest
   * 404 and any other transport error into a 503.
   */
  async getUserBySupabaseId(supabaseUserId: string): Promise<GrpcUserProfile> {
    try {
      return await firstValueFrom(
        this.profiles.GetUserBySupabaseId({ supabase_user_id: supabaseUserId }),
      );
    } catch (err: any) {
      if (err?.code === GrpcStatus.NOT_FOUND) {
        throw new NotFoundException('User profile not found');
      }
      throw new ServiceUnavailableException('user-service is unavailable');
    }
  }
}
