import { Observable } from 'rxjs';

/** DI token for the injected via-log-service gRPC client. */
export const VIA_LOG_PACKAGE = 'VIA_LOG_PACKAGE';

export interface AddViaMinutesRequest {
  supabase_user_id: string;
  minutes: number;
}

export interface ViaMinutes {
  supabase_user_id: string;
  via_minutes: number;
}

/** Shape returned by `client.getService('ViaLog')` (see proto/via-log.proto). */
export interface ViaLogGrpc {
  AddViaMinutes(request: AddViaMinutesRequest): Observable<ViaMinutes>;
}
