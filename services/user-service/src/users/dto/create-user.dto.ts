import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/** Request body for POST /api/user-service/users (snake_case API contract). */
export class CreateUserDto {
  @ApiProperty({
    description: 'Supabase auth user id (the `sub` claim).',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @IsString()
  @IsNotEmpty()
  supabase_user_id: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ format: 'email', example: 'ada@example.com' })
  @IsEmail()
  email: string;
}
