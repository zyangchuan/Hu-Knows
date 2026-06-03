import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponse } from './user-response';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a user profile' })
  @ApiCreatedResponse({ type: UserResponse })
  @ApiConflictResponse({ description: 'supabase_user_id or email already exists' })
  create(@Body() dto: CreateUserDto): Promise<UserResponse> {
    return this.users.create(dto);
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the authenticated user's profile" })
  @ApiOkResponse({ type: UserResponse })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Supabase JWT' })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserResponse> {
    return this.users.findBySupabaseUserId(user.supabaseUserId);
  }
}
