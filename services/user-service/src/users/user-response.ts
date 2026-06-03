import { UserProfile } from './user-profile.entity';

/** Serialized profile — snake_case to preserve the original API contract. */
export interface UserResponse {
  id: string;
  supabase_user_id: string;
  name: string;
  email: string;
  created_at: Date;
}

export function toUserResponse(user: UserProfile): UserResponse {
  return {
    id: user.id,
    supabase_user_id: user.supabaseUserId,
    name: user.name,
    email: user.email,
    created_at: user.createdAt,
  };
}
