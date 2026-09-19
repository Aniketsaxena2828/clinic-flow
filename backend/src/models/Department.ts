import { SupabaseRepository } from '../config/supabase';

export interface IDepartment {
  _id?: string;
  id?: string;
  clinicId: string | any;
  name: string;
  code: string;
  description?: string;
  headDoctorId?: string | any;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  save?: () => Promise<IDepartment>;
  toObject?: () => any;
}

export const Department = new SupabaseRepository<IDepartment>('departments');
