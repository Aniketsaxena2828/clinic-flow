import { SupabaseRepository } from '../config/supabase';

export interface IPrescriptionMedicine {
  medicineName: string;
  type: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface IPrescription {
  _id?: string;
  id?: string;
  clinicId: string | any;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string;
  diagnosis: string;
  symptoms?: string[];
  vitals?: {
    bp?: string;
    pulse?: string;
    temp?: string;
    weight?: string;
  };
  medicines: IPrescriptionMedicine[];
  advice?: string;
  followUpDate?: string;
  status: 'Active' | 'Completed' | 'Archived';
  createdAt?: Date | string;
  updatedAt?: Date | string;
  save?: () => Promise<IPrescription>;
  toObject?: () => any;
}

export const Prescription = new SupabaseRepository<IPrescription>('prescriptions');
