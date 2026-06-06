import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { VOLUNTEER_ROLE } from '../user-client/user-profile.types';
import { UserServiceClient } from '../user-client/user-service.client';

/**
 * Requires the authenticated caller to be a volunteer. Role lives in
 * user_profiles (user-service), not in the JWT, so this resolves the caller's
 * profile over gRPC and checks the role. Must run AFTER SupabaseAuthGuard,
 * which populates `request.user`.
 */
@Injectable()
export class VolunteerGuard implements CanActivate {
  constructor(private readonly userClient: UserServiceClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const supabaseUserId: string | undefined = request.user?.supabaseUserId;
    if (!supabaseUserId) {
      throw new ForbiddenException('Not authenticated');
    }

    // Throws 404 if the caller has no profile in user-service.
    const profile = await this.userClient.getUserBySupabaseId(supabaseUserId);
    if (profile.role !== VOLUNTEER_ROLE) {
      throw new ForbiddenException('Volunteer role required');
    }

    request.volunteerProfile = profile;
    return true;
  }
}
