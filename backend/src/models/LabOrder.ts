import { SupabaseRepository } from '../config/supabase';

export interface ILabResultParam {
  parameter: string;
  value: string;
  unit: string;
  normalRange: string;
  flag?: 'Normal' | 'High' | 'Low' | 'Critical';
}

export interface ILabOrder {
  _id?: string;
  id?: string;
  clinicId: string | any;
  orderId: string;
  patientId: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  testName: string;
  category: string;
  price: number;
  sampleCollectedAt?: string;
  reportUrl?: string;
  status: 'Ordered' | 'Sample Collected' | 'Processing' | 'Result Ready' | 'Report Uploaded';
  results?: ILabResultParam[];
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  save?: () => Promise<ILabOrder>;
  toObject?: () => any;
}

export const LabOrder = new SupabaseRepository<ILabOrder>('lab_orders');
