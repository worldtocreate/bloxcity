export interface Reservation {
  id: string;
  username: string;
  email: string;
  status: string;
  created_at: string;
  ip_address: string | null;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
}

export interface BannedWord {
  id: string;
  word: string;
  reason: string | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  email: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  admin_user_id: string;
  admin_email: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface Stats {
  reservations: {
    total: number;
    pending: number;
    approved: number;
    denied: number;
    todayCount: number;
    weekCount: number;
    approvalRate: number;
  };
  newsletter: {
    total: number;
    active: number;
    todayCount: number;
  };
  bannedWords: number;
  blockedIPs?: number;
}

export interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string | null;
  blocked_by: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down';
  edgeFunctions: 'healthy' | 'degraded' | 'down';
  lastChecked: string;
}

export type AdminTab = 
  | "dashboard" 
  | "reservations" 
  | "newsletter" 
  | "banned" 
  | "admins" 
  | "logs" 
  | "ip-blocking" 
  | "settings";
