import { SupabaseRepository } from '../config/supabase';

export interface INotification {
  _id?: string;
  id?: string;
  clinicId: string | any;
  userId?: string;
  category: 'Appointments' | 'Billing' | 'Pharmacy' | 'Lab' | 'Prescriptions' | 'Patients' | 'System';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  actionUrl?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  save?: () => Promise<INotification>;
  toObject?: () => any;
}

export const Notification = new SupabaseRepository<INotification>('notifications');
