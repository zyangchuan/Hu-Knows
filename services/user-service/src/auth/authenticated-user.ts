import type { JWTPayload } from 'jose';

export interface AuthenticatedUser {
  supabaseUserId: string;
  email?: string;
  claims: JWTPayload;
}
