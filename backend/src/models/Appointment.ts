import { SupabaseRepository } from '../config/supabase';

export interface IAppointment {
  _id?: string;
  id?: string;
  clinicId: string | any;
  appointmentId: string; // e.g. APT-1001
  patientId: string | any;
  patientName: string;
  patientPhone: string;
  doctorId: string | any;
  doctorName: string;
  doctorSpecialization?: string;
  tokenNumber: number; // Daily sequential queue token (#1, #2, #3...)
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:30 AM"
  type: 'In-person' | 'Follow-up' | 'Emergency';
  status: 'Scheduled' | 'Confirmed' | 'Checked In' | 'In Consultation' | 'Completed' | 'Cancelled' | 'No Show';
  reasonForVisit?: string;
  notes?: string;
  paymentStatus: 'Pending' | 'Paid';
  bookedAt?: Date | string;
  checkedInAt?: Date | string;
  consultationStartedAt?: Date | string;
  completedAt?: Date | string;
  cancelledAt?: Date | string;
  cancellationReason?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  save?: () => Promise<IAppointment>;
  toObject?: () => any;
}

export const Appointment = new SupabaseRepository<IAppointment>('appointments');
