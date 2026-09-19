export type UserRoleName = 
  | 'Owner'
  | 'Admin'
  | 'Doctor'
  | 'Receptionist'
  | 'Lab Technician'
  | 'Pharmacist'
  | 'Accountant';

export interface User {
  userId: string;
  _id?: string;       // optional alias; components use this as a scoped key
  clinicId: string;
  email: string;
  role: UserRoleName;
  name: string;
}

export interface Clinic {
  _id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
  specialties: string[];
  subscriptionPlan: 'Free' | 'Pro' | 'Enterprise';
  subscriptionTier?: string;  // backend field; normalizeClinic maps it to subscriptionPlan
  workingHours: {
    start: string;
    end: string;
    days: string[];
  };
  createdAt?: string;
}

export interface Patient {
  _id: string;
  id?: string;        // Supabase returns both id and _id
  clinicId: string;
  patientId: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string;
  bloodGroup?: string;
  address?: string;
  allergies?: string[];
  medicalHistory?: string[];
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };
  createdAt?: string;
}

export interface Doctor {
  _id: string;
  id?: string;        // Supabase returns both id and _id
  clinicId: string;
  userId: string;
  name: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  department: string;
  availability: {
    days: string[];
    timeSlots: string[];
  };
  status: 'Active' | 'On Leave' | 'Inactive';
}

export type AppointmentStatus = 'Scheduled' | 'In-Progress' | 'Completed' | 'Cancelled' | 'No-Show';
export type AppointmentType = 'Consultation' | 'Follow-up' | 'Routine Checkup' | 'Emergency' | 'Procedure';

export interface Appointment {
  _id: string;
  clinicId: string;
  queueNumber: number;
  tokenNumber?: number;
  appointmentId?: string;   // backend field (e.g. APT-1001)
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date?: string;            // backend field (YYYY-MM-DD)
  timeSlot?: string;        // backend field (e.g. "09:30 AM")
  appointmentDate: string;
  appointmentTime: string;
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  vitals?: {
    bp?: string;
    pulse?: string;
    temp?: string;
    weight?: string;
  };
  createdAt?: string;
}

export interface PrescriptionItem {
  medicineName: string;
  type: 'Tablet' | 'Syrup' | 'Capsule' | 'Injection' | 'Ointment' | 'Drops';
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  _id: string;
  clinicId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  diagnosis: string;
  symptoms: string[];
  vitals?: {
    bp?: string;
    pulse?: string;
    temp?: string;
    weight?: string;
  };
  medicines: PrescriptionItem[];
  advice?: string;
  labTestsRecommended?: string[];
  followUpDate?: string;
  status?: 'Active' | 'Completed' | 'Cancelled';
  createdAt: string;
  clinic?: Clinic;
  patient?: Patient;
}

export interface BillItem {
  description: string;
  category: 'Consultation' | 'Pharmacy' | 'Lab Test' | 'Procedure' | 'Other';
  unitPrice: number;
  quantity: number;
  amount: number;
}

export type PaymentStatus = 'Paid' | 'Pending' | 'Partially Paid' | 'Cancelled';
export type PaymentMethod = 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking';

export interface Payment {
  _id: string;
  billId: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  paidAt: string;
}

export interface Bill {
  _id: string;
  invoiceNumber: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId?: string;
  doctorName?: string;
  appointmentId?: string;
  items: BillItem[];
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  payments: Payment[];
  createdAt: string;
}

export interface Medicine {
  _id: string;
  clinicId: string;
  name: string;
  category: string;
  composition: string;
  manufacturer: string;
  batchNumber: string;
  expiryDate: string;
  unitPrice: number;
  mrp: number;
  stockQuantity: number;
  minStockAlert: number;
  unit: 'Tablet' | 'Strip' | 'Bottle' | 'Box' | 'Ampoule';
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Expired';
}

export interface Staff {
  _id: string;
  clinicId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRoleName;
  department?: string;
  status: 'Active' | 'Inactive';
}
