import { SupabaseRepository } from '../config/supabase';

export interface IAuditLog {
  _id?: string;
  id?: string;
  clinicId: string | any;
  userId?: string | any;
  userEmail?: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date | string;
  save?: () => Promise<IAuditLog>;
  toObject?: () => any;
}

export const AuditLog = new SupabaseRepository<IAuditLog>('audit_logs');
