import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { UserRole } from '../user-profile.entity';

/** Request body for POST /api/user-service/users (snake_case API contract). */
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  supabase_user_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @IsNotEmpty()
  organisation: string;
}
