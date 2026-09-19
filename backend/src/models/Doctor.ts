import { SupabaseRepository } from '../config/supabase';

export interface IDoctor {
  _id?: string;
  id?: string;
  clinicId: string | any;
  userId?: string | any;
  name: string;
  email: string;
  phone: string;
  departmentId?: string | any;
  departmentName?: string;
  specialization: string;
  experienceYears: number;
  consultationFee: number;
  availableDays: string[];
  slotDurationMinutes: number;
  status: 'active' | 'on_leave' | 'inactive';
  createdAt?: Date | string;
  updatedAt?: Date | string;
  save?: () => Promise<IDoctor>;
  toObject?: () => any;
}

export const Doctor = new SupabaseRepository<IDoctor>('doctors');
