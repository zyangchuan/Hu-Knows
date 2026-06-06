import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A single row per user holding their current total VIA minutes. The user is
 * referenced only by Supabase user id — there is NO FK to the user_profiles
 * table (owned by user-service).
 */
@Entity('via_log')
export class ViaLog {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index({ unique: true })
  @Column({ name: 'supabase_user_id' })
  supabaseUserId: string;

  // Current total VIA contribution in minutes.
  @Column({ name: 'via_minutes', type: 'int', default: 0 })
  viaMinutes: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    // Generate app-side to stay independent of any Postgres uuid extension.
    if (!this.id) this.id = randomUUID();
  }
}
