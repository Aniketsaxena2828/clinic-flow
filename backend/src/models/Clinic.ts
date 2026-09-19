import { SupabaseRepository } from '../config/supabase';

export interface IClinic {
  _id?: string;
  id?: string;
  name: string;
  code: string; // Unique clinic handle/slug (e.g. dental-care-ny)
  email: string;
  phone: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  gstNumber?: string;
  logoUrl?: string;
  workingHours?: {
    open: string;
    close: string;
    days: string[];
  };
  subscriptionTier: 'free_trial' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'inactive';
  createdAt?: Date | string;
  updatedAt?: Date | string;
  save?: () => Promise<IClinic>;
  toObject?: () => any;
}

export const Clinic = new SupabaseRepository<IClinic>('clinics');
