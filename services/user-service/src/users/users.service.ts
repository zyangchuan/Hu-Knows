import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { UserProfile } from './user-profile.entity';
import { toUserResponse, UserResponse } from './user-response';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly repo: Repository<UserProfile>,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponse> {
    const user = this.repo.create({
      supabaseUserId: dto.supabase_user_id,
      name: dto.name,
      email: dto.email,
    });

    try {
      const saved = await this.repo.save(user);
      return toUserResponse(saved);
    } catch (err) {
      if (err instanceof QueryFailedError && (err as any).code === UNIQUE_VIOLATION) {
        throw new ConflictException(
          'A user with this supabase_user_id or email already exists',
        );
      }
      throw err;
    }
  }

  /** Look up the profile entity, or null when absent. */
  findEntityBySupabaseUserId(supabaseUserId: string): Promise<UserProfile | null> {
    return this.repo.findOne({ where: { supabaseUserId } });
  }

  async findBySupabaseUserId(supabaseUserId: string): Promise<UserResponse> {
    const user = await this.findEntityBySupabaseUserId(supabaseUserId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    return toUserResponse(user);
  }
}
