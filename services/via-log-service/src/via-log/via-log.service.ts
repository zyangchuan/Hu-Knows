import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ViaLog } from './via-log.entity';
import { ViaMinutesResponse } from './via-log-response';

@Injectable()
export class ViaLogService {
  constructor(
    @InjectRepository(ViaLog)
    private readonly repo: Repository<ViaLog>,
  ) {}

  /** Current total VIA minutes for a user; 0 when the user has no row yet. */
  async getTotalForUser(supabaseUserId: string): Promise<ViaMinutesResponse> {
    const row = await this.repo.findOne({ where: { supabaseUserId } });
    return {
      user_id: supabaseUserId,
      via_minutes: row?.viaMinutes ?? 0,
    };
  }

  /**
   * Add `minutes` (>= 0) to a user's current VIA total, creating the row if it
   * does not exist. Returns the new total.
   */
  async addMinutes(
    supabaseUserId: string,
    minutes: number,
  ): Promise<ViaMinutesResponse> {
    const existing = await this.repo.findOne({ where: { supabaseUserId } });
    const row =
      existing ?? this.repo.create({ supabaseUserId, viaMinutes: 0 });
    row.viaMinutes += minutes;
    const saved = await this.repo.save(row);
    return {
      user_id: saved.supabaseUserId,
      via_minutes: saved.viaMinutes,
    };
  }
}
