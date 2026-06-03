import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

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
}
