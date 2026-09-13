export interface LoginRequest {
  username: string;
  password?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  username: string;
  full_name: string;
  role: string;
  district: string;
  escalation_level: string;
}

export interface UserProfile {
  user_id: string;
  username: string;
  full_name: string;
  role: string;
  district: string;
  escalation_level: string;
  contact_number: string;
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
