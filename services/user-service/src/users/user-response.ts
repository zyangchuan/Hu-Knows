import { ApiProperty } from '@nestjs/swagger';

import { UserProfile } from './user-profile.entity';

/** Serialized profile — snake_case to preserve the original API contract. */
export class UserResponse {
  @ApiProperty({ format: 'uuid', example: '5b637d7d-a1bd-419c-afb8-d4bc2f7dc5a4' })
  id: string;

  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  supabase_user_id: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  name: string;

  @ApiProperty({ format: 'email', example: 'ada@example.com' })
  email: string;

  @ApiProperty({ type: String, format: 'date-time' })
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
