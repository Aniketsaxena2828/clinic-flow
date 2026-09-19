import { SupabaseRepository } from '../config/supabase';

export interface IRole {
  _id?: string;
  id?: string;
  clinicId?: string | any; // null for system template roles
  name: string; // Owner, Admin, Doctor, Receptionist, Lab Technician, Pharmacist, Accountant
  description?: string;
  isSystem: boolean;
  permissions: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  save?: () => Promise<IRole>;
  toObject?: () => any;
}

export const Role = new SupabaseRepository<IRole>('roles');
