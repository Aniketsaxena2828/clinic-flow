import { SupabaseRepository } from '../config/supabase';

export interface IPatientDocument {
  title: string;
  fileUrl: string;
  fileType?: string;
  uploadedAt: Date | string;
}

export interface IPatient {
  _id?: string;
  id?: string;
  clinicId: string | any;
  patientId: string; // e.g. PAT-1001
  name: string;
  email?: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other';
  age?: number;
  dateOfBirth?: Date | string;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  medicalHistory?: string[];
  allergies?: string[];
  documents?: IPatientDocument[];
  status: 'active' | 'archived';
  createdAt?: Date | string;
  updatedAt?: Date | string;
  save?: () => Promise<IPatient>;
  toObject?: () => any;
}

export const Patient = new SupabaseRepository<IPatient>('patients');
