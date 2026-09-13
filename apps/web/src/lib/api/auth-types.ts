export type OfficerRole = 'admin' | 'state_officer' | 'district_officer' | string;

export interface LoginRequest {
  username: string;
  password?: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface CreateOfficerPayload {
  username: string;
  password?: string;
  full_name: string;
  role: string;
  district?: string | null;
  state?: string | null;
  contact_number?: string | null;
}

export interface TokenResponse {
  status: string;
  access_token: string;
  token_type: string;
  user_id: string;
  username: string;
  full_name: string;
  role: OfficerRole;
  district: string | null;
  state: string | null;
  escalation_level: number;
  csrf_token?: string | null;
}

export interface UserProfile {
  user_id: string;
  username: string;
  full_name: string;
  role: OfficerRole;
  district: string | null;
  state: string | null;
  escalation_level: number;
  contact_number: string | null;
  csrf_token?: string | null;
}

export interface SessionStatusResponse {
  authenticated: boolean;
  user: UserProfile | null;
}

export interface AuditLogItem {
  log_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor: string;
  timestamp: string;
  data_snapshot_ref?: string | null;
  details?: Record<string, unknown> | null;
}
