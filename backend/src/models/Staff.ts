import { SupabaseRepository } from '../config/supabase';

export interface IStaffMember {
  _id?: string;
  id?: string;
  clinicId: string | any;
  name: string;
  email: string;
  phone: string;
  roleName: 'Doctor' | 'Nurse' | 'Receptionist' | 'Pharmacist' | 'Lab Technician' | 'Accountant' | 'Administrator';
  department: string;
  designation: string;
  status: 'Active' | 'Inactive' | 'Pending';
  permissions?: Record<string, boolean>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  save?: () => Promise<IStaffMember>;
  toObject?: () => any;
}

export const Staff = new SupabaseRepository<IStaffMember>('staff');
