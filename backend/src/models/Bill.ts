import { SupabaseRepository } from '../config/supabase';

export interface IBillItem {
  description: string;
  category: 'Consultation' | 'Lab' | 'Pharmacy' | 'Procedure' | 'Other';
  unitPrice: number;
  quantity: number;
  amount: number;
}

export interface IPaymentRecord {
  _id?: string;
  id?: string;
  billId?: string;
  amountPaid: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Other';
  transactionRef?: string;
  notes?: string;
  paidAt: Date | string;
}

export interface IBill {
  _id?: string;
  id?: string;
  clinicId: string | any;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  doctorId?: string;
  doctorName?: string;
  items: IBillItem[];
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: 'Pending' | 'Partially Paid' | 'Paid';
  payments: IPaymentRecord[];
  dueDate?: string;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  save?: () => Promise<IBill>;
  toObject?: () => any;
}

export const Bill = new SupabaseRepository<IBill>('bills');
