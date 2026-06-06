import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

/** Role assigned to a user profile. */
export enum UserRole {
  Volunteer = 'volunteer',
  Organiser = 'organiser',
}

/** A user profile linked 1:1 to a Supabase auth user. */
@Entity('user_profiles')
export class UserProfile {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index({ unique: true })
  @Column({ name: 'supabase_user_id' })
  supabaseUserId: string;

  @Column()
  name: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column()
  organisation: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @BeforeInsert()
  generateId() {
    // Generate app-side to stay independent of any Postgres uuid extension.
    if (!this.id) this.id = randomUUID();
  }
}
