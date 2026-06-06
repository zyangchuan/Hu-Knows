import { Observable } from 'rxjs';

/** DI token for the injected user-service gRPC client. */
export const USER_SERVICE_PACKAGE = 'USER_SERVICE_PACKAGE';

/** Proto `Role` enum names (loader is configured with enums: String). */
export const VOLUNTEER_ROLE = 'VOLUNTEER';
export const ORGANISER_ROLE = 'ORGANISER';

/** Mirrors the `UserProfile` message in proto/user.proto (snake_case kept). */
export interface GrpcUserProfile {
  id: string;
  supabase_user_id: string;
  name: string;
  email: string;
  role: string; // proto enum NAME, e.g. 'VOLUNTEER' | 'ORGANISER'
  organisation: string;
  created_at: string;
}

export interface GetUserBySupabaseIdRequest {
  supabase_user_id: string;
}

/** Shape returned by `client.getService('UserProfiles')`. */
export interface UserProfilesGrpc {
  GetUserBySupabaseId(
    request: GetUserBySupabaseIdRequest,
  ): Observable<GrpcUserProfile>;
}
