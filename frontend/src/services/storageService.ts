import { Patient, Doctor, Appointment, Bill, Medicine, Prescription } from '../types';
import api from './api';

export interface OperatingHoursDay {
  enabled: boolean;
  openTime: string;
  closeTime: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface ClinicSettings {
  clinicName: string;
  clinicLogoUrl?: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  gstin: string;
  registrationNumber: string;
  description: string;
  operatingHours: {
    monday: OperatingHoursDay;
    tuesday: OperatingHoursDay;
    wednesday: OperatingHoursDay;
    thursday: OperatingHoursDay;
    friday: OperatingHoursDay;
    saturday: OperatingHoursDay;
    sunday: OperatingHoursDay;
  };
  appointment: {
    defaultDurationMinutes: number;
    bufferMinutes: number;
    allowFutureBooking: boolean;
    maxFutureDays: number;
    allowSameDay: boolean;
    allowDoubleBooking: boolean;
    cancellationPolicy: string;
  };
  billing: {
    currency: string;
    currencySymbol: string;
    gstEnabled: boolean;
    defaultGstRate: number;
    invoicePrefix: string;
    nextInvoiceNumber: number;
    paymentMethods: string[];
  };
  prescription: {
    rxPrefix: string;
    doctorSignatureText: string;
    defaultAdviceText: string;
    displayClinicHeader: boolean;
    followUpDefaultDays: number;
  };
  pharmacy: {
    lowStockThreshold: number;
    expiryWarningDays: number;
    defaultMedicineTaxRate: number;
    categories: string[];
  };
  lab: {
    labName: string;
    labContactPhone: string;
    reportPrefix: string;
    pathologistName: string;
    pathologistTitle: string;
    categories: string[];
  };
  notifications: {
    emailAlerts: boolean;
    smsAlerts: boolean;
    appointmentReminders: boolean;
    lowStockAlerts: boolean;
    labResultAlerts: boolean;
    billingPaymentAlerts: boolean;
  };
  security: {
    sessionTimeoutMinutes: number;
    twoFactorAuth: boolean;
    ipWhitelistEnabled: boolean;
    timezone?: string;
    dateFormat?: string;
    timeFormat?: string;
  };
  tenant?: {
    tenantId: string;
    tenantCode: string;
    subscriptionPlan: string;
    subscriptionStatus: string;
  };
}

export interface NotificationPreferences {
  masterEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  browserPush: boolean;
  soundAlerts: boolean;
  appointments: boolean;
  billing: boolean;
  pharmacy: boolean;
  lab: boolean;
  prescriptions: boolean;
  patients: boolean;
  system: boolean;
}

export interface NotificationItem {
  id: string;
  tenantId?: string;
  type: 'appointment' | 'billing' | 'pharmacy' | 'lab' | 'prescription' | 'patient' | 'system' | 'payment';
  priority: 'info' | 'warning' | 'success' | 'critical';
  title: string;
  desc: string;
  link?: string;
  read: boolean;
  createdAt: string;
  entityId?: string;
}

export interface StaffPermissions {
  dashboard: boolean;
  patients: boolean;
  doctors: boolean;
  appointments: boolean;
  prescriptions: boolean;
  billing: boolean;
  pharmacy: boolean;
  lab: boolean;
  staff: boolean;
  analytics: boolean;
  settings: boolean;
}

export interface StaffMember {
  _id: string;
  staffId?: string;
  name: string;
  email: string;
  phone: string;
  roleName: 'Owner' | 'Admin' | 'Doctor' | 'Nurse' | 'Receptionist' | 'Pharmacist' | 'Lab Technician' | 'Accountant' | 'Administrator';
  department: string;
  designation: string;
  joiningDate?: string;
  status: 'Active' | 'Pending' | 'Suspended' | 'Inactive';
  lastActive?: string;
  permissions?: StaffPermissions;
  activityLogs?: Array<{ action: string; timestamp: string; actor: string }>;
}

export interface LabResultParam {
  parameter: string;
  value: string;
  unit: string;
  normalRange: string;
  flag?: 'Normal' | 'High' | 'Low' | 'Critical';
}

// Alias used in LabDiagnostics.tsx
export type LabResultItem = LabResultParam;

export interface LabTestItem {
  testName: string;
  category: string;
  price: number;
  sampleType: string;
  preparationInstructions?: string;
}

export interface LabOrder {
  _id: string;
  orderId?: string;
  testId?: string;
  testName: string;
  category: string;
  patientId?: string;
  patientName: string;
  patientPhone?: string;
  patientAge?: number;
  patientGender?: string;
  doctorId?: string;
  doctorName?: string;
  doctorSpecialization?: string;
  sampleType?: string;
  sampleStatus?: string;
  sampleCollectedAt?: string;
  sampleCollectedBy?: string;
  status: 'Ordered' | 'Sample Collected' | 'Processing' | 'Result Ready' | 'Report Uploaded' | 'Cancelled';
  price: number;
  tests?: LabTestItem[];
  results?: LabResultParam[];
  notes?: string;
  reportUrl?: string;
  createdAt: string;
}

export const STORAGE_KEYS = {
  SETTINGS: 'clinicflow_settings',
  NOTIF_PREFS: 'clinicflow_notif_prefs',
  PATIENTS: 'clinicflow_patients',
  DOCTORS: 'clinicflow_doctors',
  APPOINTMENTS: 'clinicflow_appointments',
  PRESCRIPTIONS: 'clinicflow_prescriptions',
  BILLS: 'clinicflow_bills',
  PHARMACY: 'clinicflow_pharmacy',
  LAB: 'clinicflow_lab',
  STAFF: 'clinicflow_staff',
  NOTIFICATIONS: 'clinicflow_notifications'
};

const INITIAL_SETTINGS: ClinicSettings = {
  clinicName: 'LifeCare Multi-Specialty Clinic',
  clinicLogoUrl: '',
  phone: '+1-800-555-0100',
  email: 'contact@democlinic.com',
  website: 'https://democlinic.com',
  address: '100 Healthcare Boulevard',
  city: 'Metropolis',
  state: 'NY',
  country: 'USA',
  postalCode: '10001',
  gstin: '27AAAAA0000A1Z5',
  registrationNumber: 'MED-NY-2024-001',
  description: 'Premier multi-specialty healthcare and diagnostic center providing compassionate outpatient care.',
  operatingHours: {
    monday: { enabled: true, openTime: '08:00', closeTime: '20:00', breakStart: '13:00', breakEnd: '14:00' },
    tuesday: { enabled: true, openTime: '08:00', closeTime: '20:00', breakStart: '13:00', breakEnd: '14:00' },
    wednesday: { enabled: true, openTime: '08:00', closeTime: '20:00', breakStart: '13:00', breakEnd: '14:00' },
    thursday: { enabled: true, openTime: '08:00', closeTime: '20:00', breakStart: '13:00', breakEnd: '14:00' },
    friday: { enabled: true, openTime: '08:00', closeTime: '20:00', breakStart: '13:00', breakEnd: '14:00' },
    saturday: { enabled: true, openTime: '09:00', closeTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
    sunday: { enabled: false, openTime: '09:00', closeTime: '13:00' }
  },
  appointment: {
    defaultDurationMinutes: 15,
    bufferMinutes: 5,
    allowFutureBooking: true,
    maxFutureDays: 30,
    allowSameDay: true,
    allowDoubleBooking: false,
    cancellationPolicy: 'Cancellations allowed up to 2 hours prior to scheduled appointment slot.'
  },
  billing: {
    currency: 'INR',
    currencySymbol: '₹',
    gstEnabled: true,
    defaultGstRate: 18,
    invoicePrefix: 'INV-2026-',
    nextInvoiceNumber: 105,
    paymentMethods: ['Cash', 'UPI', 'Card', 'Bank Transfer']
  },
  prescription: {
    rxPrefix: 'RX-2026-',
    doctorSignatureText: 'Authorized Medical Officer Signature',
    defaultAdviceText: 'Take prescribed medication after meals with warm water. Rest adequately.',
    displayClinicHeader: true,
    followUpDefaultDays: 7
  },
  pharmacy: {
    lowStockThreshold: 20,
    expiryWarningDays: 90,
    defaultMedicineTaxRate: 12,
    categories: ['Analgesics', 'Antibiotics', 'Antidiabetics', 'Cardiovascular', 'Vitamins & Supplements', 'Dermatological']
  },
  lab: {
    labName: 'Apex Central Pathology & Radiology Diagnostics',
    labContactPhone: '+91 98765 00099',
    reportPrefix: 'LAB-2026-',
    pathologistName: 'Dr. Anita Roy',
    pathologistTitle: 'MD (Pathology), Lead Consultant',
    categories: ['Hematology', 'Biochemistry', 'Serology', 'Microbiology', 'Radiology']
  },
  notifications: {
    emailAlerts: true,
    smsAlerts: true,
    appointmentReminders: true,
    lowStockAlerts: true,
    labResultAlerts: true,
    billingPaymentAlerts: true
  },
  security: {
    sessionTimeoutMinutes: 60,
    twoFactorAuth: false,
    ipWhitelistEnabled: false,
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD-MM-YYYY',
    timeFormat: '12-hour'
  },
  tenant: {
    tenantId: 'clinic-default',
    tenantCode: 'apex-health',
    subscriptionPlan: 'Professional',
    subscriptionStatus: 'Active'
  }
};

const INITIAL_NOTIF_PREFERENCES: NotificationPreferences = {
  masterEnabled: true,
  emailNotifications: true,
  smsNotifications: true,
  browserPush: true,
  soundAlerts: true,
  appointments: true,
  billing: true,
  pharmacy: true,
  lab: true,
  prescriptions: true,
  patients: true,
  system: true
};

// Clear stale storage keys for persistent business data
export const clearTenantCache = () => {
  try {
    const keysToRemove = [
      STORAGE_KEYS.PATIENTS,
      STORAGE_KEYS.DOCTORS,
      STORAGE_KEYS.APPOINTMENTS,
      STORAGE_KEYS.BILLS,
      STORAGE_KEYS.PHARMACY,
      STORAGE_KEYS.LAB,
      STORAGE_KEYS.STAFF,
      STORAGE_KEYS.PRESCRIPTIONS,
      STORAGE_KEYS.SETTINGS
    ];
    keysToRemove.forEach(k => {
      sessionStorage.removeItem(k);
      localStorage.removeItem(k);
    });
  } catch (e) {}
};

const getStoredData = <T>(key: string, initialData: T): T => {
  try {
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
    if (!raw) return initialData;
    return JSON.parse(raw);
  } catch (err) {
    return initialData;
  }
};

const setStoredData = <T>(key: string, data: T): void => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (err) {}
};

// In-Memory live cache for instantaneous UI rendering
let cachedSettings: ClinicSettings | null = null;
let cachedNotifPrefs: NotificationPreferences | null = null;
let cachedNotifications: NotificationItem[] = [];

export const filterNotificationsByPreferences = (
  notifs: NotificationItem[],
  prefs?: NotificationPreferences
): NotificationItem[] => {
  if (!prefs) return notifs;
  return notifs.filter((n) => {
    const isCritical = n.priority === 'critical';
    if (isCritical) return true;

    if (!prefs.masterEnabled) {
      return false;
    }

    switch (n.type) {
      case 'appointment':
        return prefs.appointments !== false;
      case 'billing':
      case 'payment':
        return prefs.billing !== false;
      case 'pharmacy':
        return prefs.pharmacy !== false;
      case 'lab':
        return prefs.lab !== false;
      case 'prescription':
        return prefs.prescriptions !== false;
      case 'patient':
        return prefs.patients !== false;
      case 'system':
        return prefs.system !== false;
      default:
        return true;
    }
  });
};

export const storageService = {
  clearTenantCache: () => {
    cachedSettings = null;
    cachedNotifPrefs = null;
    cachedNotifications = [];
    clearTenantCache();
  },

  // Settings
  getSettings: (): ClinicSettings => {
    if (cachedSettings) return cachedSettings;
    const stored = getStoredData(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    cachedSettings = stored;
    return stored;
  },

  fetchSettings: async (): Promise<ClinicSettings> => {
    try {
      const res = await api.get('/clinic/settings');
      if (res.data?.data) {
        cachedSettings = res.data.data;
        setStoredData(STORAGE_KEYS.SETTINGS, res.data.data);
        return res.data.data;
      }
    } catch (e) {
      console.warn('[storageService] fetchSettings fallback to local cache:', e);
    }
    return storageService.getSettings();
  },

  saveSettings: async (settings: ClinicSettings): Promise<ClinicSettings> => {
    cachedSettings = settings;
    setStoredData(STORAGE_KEYS.SETTINGS, settings);
    try {
      const res = await api.put('/clinic/settings', settings);
      if (res.data?.data) {
        cachedSettings = res.data.data;
        setStoredData(STORAGE_KEYS.SETTINGS, res.data.data);
        return res.data.data;
      }
    } catch (e) {
      console.error('[storageService] saveSettings API error:', e);
    }
    return settings;
  },

  // Notification Preferences
  getNotificationPreferences: (userId: string = 'usr-1'): NotificationPreferences => {
    if (cachedNotifPrefs) return cachedNotifPrefs;
    const key = `${STORAGE_KEYS.NOTIF_PREFS}_${userId}`;
    const stored = getStoredData(key, INITIAL_NOTIF_PREFERENCES);
    cachedNotifPrefs = stored;
    return stored;
  },

  fetchNotificationPreferences: async (userId: string = 'usr-1'): Promise<NotificationPreferences> => {
    try {
      const res = await api.get('/notifications/preferences');
      if (res.data?.data) {
        cachedNotifPrefs = res.data.data;
        const key = `${STORAGE_KEYS.NOTIF_PREFS}_${userId}`;
        setStoredData(key, res.data.data);
        return res.data.data;
      }
    } catch (e) {
      console.warn('[storageService] fetchNotificationPreferences fallback:', e);
    }
    return storageService.getNotificationPreferences(userId);
  },

  saveNotificationPreferences: async (userId: string = 'usr-1', prefs: NotificationPreferences): Promise<NotificationPreferences> => {
    cachedNotifPrefs = prefs;
    const key = `${STORAGE_KEYS.NOTIF_PREFS}_${userId}`;
    setStoredData(key, prefs);
    try {
      const res = await api.put('/notifications/preferences', prefs);
      if (res.data?.data) {
        cachedNotifPrefs = res.data.data;
        setStoredData(key, res.data.data);
        return res.data.data;
      }
    } catch (e) {
      console.error('[storageService] saveNotificationPreferences API error:', e);
    }
    return prefs;
  },

  // Password / Security Management
  changePassword: async (currentPassword: string, newPassword: string): Promise<any> => {
    const res = await api.post('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },

  // Async API Sources of Truth from MongoDB
  fetchPatients: async (): Promise<Patient[]> => {
    try {
      const res = await api.get('/patients');
      if (res.data?.data?.patients) return res.data.data.patients;
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    } catch (e) {
      return [];
    }
  },

  fetchDoctors: async (): Promise<Doctor[]> => {
    try {
      const res = await api.get('/doctors');
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    } catch (e) {
      return [];
    }
  },

  fetchAppointments: async (): Promise<Appointment[]> => {
    try {
      const res = await api.get('/appointments');
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    } catch (e) {
      return [];
    }
  },

  fetchBills: async (): Promise<Bill[]> => {
    try {
      const res = await api.get('/billing');
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    } catch (e) {
      return [];
    }
  },

  fetchPrescriptions: async (): Promise<Prescription[]> => {
    try {
      const res = await api.get('/prescriptions');
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    } catch (e) {
      return [];
    }
  },

  fetchPharmacy: async (): Promise<Medicine[]> => {
    try {
      const res = await api.get('/pharmacy/medicines');
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    } catch (e) {
      return [];
    }
  },

  fetchLabOrders: async (): Promise<LabOrder[]> => {
    try {
      const res = await api.get('/lab/orders');
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    } catch (e) {
      return [];
    }
  },

  fetchStaff: async (): Promise<StaffMember[]> => {
    try {
      const res = await api.get('/staff');
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    } catch (e) {
      return [];
    }
  },

  fetchNotifications: async (userId: string = 'usr-1'): Promise<NotificationItem[]> => {
    try {
      const res = await api.get('/notifications');
      if (Array.isArray(res.data?.data)) {
        const rawList: NotificationItem[] = res.data.data.map((n: any) => {
          const rawCat = (n.category || '').toLowerCase();
          let type: NotificationItem['type'] = 'system';
          if (rawCat.includes('appoint')) type = 'appointment';
          else if (rawCat.includes('bill') || rawCat.includes('pay')) type = 'billing';
          else if (rawCat.includes('pharm')) type = 'pharmacy';
          else if (rawCat.includes('lab')) type = 'lab';
          else if (rawCat.includes('presc')) type = 'prescription';
          else if (rawCat.includes('pat')) type = 'patient';

          return {
            id: n._id || n.id,
            type,
            priority: n.priority || 'info',
            title: n.title,
            desc: n.message,
            link: n.actionUrl || n.action_url || '/dashboard',
            read: Boolean(n.read),
            createdAt: n.createdAt || n.created_at || new Date().toISOString()
          };
        });

        cachedNotifications = rawList;
        setStoredData(STORAGE_KEYS.NOTIFICATIONS, rawList);
        const prefs = storageService.getNotificationPreferences(userId);
        return filterNotificationsByPreferences(rawList, prefs);
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  // Synchronous Callbacks
  getPatients: (): any[] => [],
  savePatient: async (patient: any): Promise<any> => {
    const res = await api.post('/patients', patient);
    return res.data?.data || patient;
  },
  updatePatient: async (patient: any): Promise<any> => {
    const res = await api.put(`/patients/${patient._id}`, patient);
    return res.data?.data || patient;
  },
  deletePatient: async (id: string): Promise<void> => {
    await api.delete(`/patients/${id}`);
  },

  getDoctors: (): any[] => [],
  saveDoctor: async (doctor: any): Promise<any> => {
    const res = await api.post('/doctors', doctor);
    return res.data?.data || doctor;
  },
  updateDoctor: async (doctor: any): Promise<any> => {
    const res = await api.put(`/doctors/${doctor._id}`, doctor);
    return res.data?.data || doctor;
  },
  deleteDoctor: async (id: string): Promise<void> => {
    await api.delete(`/doctors/${id}`);
  },

  getAppointments: (): any[] => [],
  saveAppointment: async (appt: any): Promise<any> => {
    const res = await api.post('/appointments', appt);
    return res.data?.data || appt;
  },
  updateAppointmentStatus: async (id: string, status: string, metadata?: any): Promise<any> => {
    const res = await api.patch(`/appointments/${id}/status`, { status, ...metadata });
    return res.data?.data;
  },
  rescheduleAppointment: async (id: string, data: { date: string; timeSlot: string; doctorId?: string }): Promise<any> => {
    const res = await api.put(`/appointments/${id}/reschedule`, data);
    return res.data?.data;
  },
  updateAppointment: async (appt: any): Promise<any> => {
    const apptId = appt._id || appt.id;
    if (appt.date && appt.timeSlot) {
      const res = await api.put(`/appointments/${apptId}/reschedule`, {
        date: appt.date,
        timeSlot: appt.timeSlot,
        doctorId: appt.doctorId
      }).catch(() => api.patch(`/appointments/${apptId}/status`, appt));
      return res.data?.data || appt;
    }
    const res = await api.patch(`/appointments/${apptId}/status`, appt);
    return res.data?.data || appt;
  },

  getPrescriptions: (): any[] => [],
  savePrescription: async (rx: any): Promise<any> => {
    const res = await api.post('/prescriptions', rx);
    return res.data?.data || rx;
  },
  deletePrescription: async (id: string): Promise<void> => {
    await api.delete(`/prescriptions/${id}`);
  },

  getBills: (): any[] => [],
  saveBill: async (bill: any): Promise<any> => {
    const res = await api.post('/billing', bill);
    return res.data?.data || bill;
  },
  updateBill: async (id: string, data: any): Promise<any> => {
    const res = await api.put(`/billing/${id}`, data);
    return res.data?.data;
  },
  deleteBill: async (id: string): Promise<void> => {
    await api.delete(`/billing/${id}`);
  },
  payBill: async (billId: string, amountPaid: number, method: string, ref: string): Promise<any> => {
    const res = await api.post(`/billing/${billId}/pay`, { amountPaid, paymentMethod: method, transactionRef: ref });
    return res.data?.data;
  },

  getPharmacy: (): any[] => [],
  getMedicines: (): any[] => [],
  saveMedicine: async (med: any): Promise<any> => {
    const res = await api.post('/pharmacy/medicines', med);
    return res.data?.data || med;
  },
  adjustMedicineStock: async (id: string, qtyChange: number): Promise<any> => {
    const res = await api.patch(`/pharmacy/medicines/${id}/stock`, { qtyChange });
    return res.data?.data;
  },
  deleteMedicine: async (id: string): Promise<void> => {
    await api.delete(`/pharmacy/medicines/${id}`);
  },

  getLabOrders: (): LabOrder[] => [],
  saveLabOrder: async (order: any): Promise<LabOrder> => {
    const res = await api.post('/lab/orders', order);
    return res.data?.data || order;
  },
  updateLabOrder: async (id: string, data: any): Promise<LabOrder> => {
    const res = await api.put(`/lab/orders/${id}`, data);
    return res.data?.data;
  },
  updateLabResults: async (id: string, results: any[], notes?: string): Promise<any> => {
    const res = await api.put(`/lab/orders/${id}/results`, { results, notes });
    return res.data?.data;
  },
  uploadLabReport: async (orderId: string, reportUrl: string): Promise<any> => {
    const res = await api.post(`/lab/orders/${orderId}/report`, { reportUrl });
    return res.data?.data;
  },
  deleteLabOrder: async (id: string): Promise<void> => {
    await api.delete(`/lab/orders/${id}`);
  },

  getStaff: (): StaffMember[] => [],
  saveStaff: async (member: StaffMember): Promise<StaffMember> => {
    const res = await api.post('/staff', member);
    return res.data?.data || member;
  },
  updateStaffPermissions: async (id: string, permissions: StaffPermissions): Promise<any> => {
    const res = await api.put(`/staff/${id}`, { permissions });
    return res.data?.data;
  },
  toggleStaffStatus: async (id: string, newStatus: string): Promise<any> => {
    const res = await api.put(`/staff/${id}`, { status: newStatus });
    return res.data?.data;
  },
  deleteStaff: async (id: string): Promise<void> => {
    await api.delete(`/staff/${id}`);
  },

  getNotifications: (userId: string = 'usr-1'): NotificationItem[] => {
    const list = cachedNotifications || getStoredData<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const prefs = storageService.getNotificationPreferences(userId);
    return filterNotificationsByPreferences(list, prefs);
  },
  getUnreadNotifCount: (userId: string = 'usr-1'): number => {
    const list = storageService.getNotifications(userId);
    return list.filter(n => !n.read).length;
  },
  addNotification: (notif: Partial<NotificationItem>): NotificationItem | null => {
    const newNotif: NotificationItem = {
      id: notif.id || `notif-${Date.now()}`,
      type: notif.type || 'system',
      priority: notif.priority || 'info',
      title: notif.title || 'System Notification',
      desc: notif.desc || '',
      link: notif.link || '/dashboard',
      read: false,
      createdAt: notif.createdAt || new Date().toISOString()
    };
    if (cachedNotifications) {
      cachedNotifications = [newNotif, ...cachedNotifications];
      setStoredData(STORAGE_KEYS.NOTIFICATIONS, cachedNotifications);
    }
    return newNotif;
  },
  markNotificationRead: async (id: string): Promise<void> => {
    if (cachedNotifications) {
      cachedNotifications = cachedNotifications.map(n => n.id === id ? { ...n, read: true } : n);
      setStoredData(STORAGE_KEYS.NOTIFICATIONS, cachedNotifications);
    }
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (e) {
      // ignore
    }
  },
  markAllNotificationsRead: async (): Promise<void> => {
    if (cachedNotifications) {
      cachedNotifications = cachedNotifications.map(n => ({ ...n, read: true }));
      setStoredData(STORAGE_KEYS.NOTIFICATIONS, cachedNotifications);
    }
    try {
      await api.post('/notifications/read-all');
    } catch (e) {
      // ignore
    }
  },
  deleteNotification: async (id: string): Promise<void> => {
    if (cachedNotifications) {
      cachedNotifications = cachedNotifications.filter(n => n.id !== id);
      setStoredData(STORAGE_KEYS.NOTIFICATIONS, cachedNotifications);
    }
    try {
      await api.delete(`/notifications/${id}`);
    } catch (e) {
      // ignore
    }
  }
};

// Date Helper Utilities (exported for use across pages)
export const getTodayLocalDateStr = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const getLocalDateStrFromISO = (isoStr: string): string => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// RBAC: Returns default module permissions for each staff role
export const getDefaultPermissionsForRole = (roleName: string): StaffPermissions => {
  const allTrue: StaffPermissions = {
    dashboard: true, patients: true, doctors: true, appointments: true,
    prescriptions: true, billing: true, pharmacy: true, lab: true,
    staff: true, analytics: true, settings: true
  };
  const receptionist: StaffPermissions = {
    dashboard: true, patients: true, doctors: false, appointments: true,
    prescriptions: false, billing: true, pharmacy: false, lab: false,
    staff: false, analytics: false, settings: false
  };
  const doctor: StaffPermissions = {
    dashboard: true, patients: true, doctors: false, appointments: true,
    prescriptions: true, billing: false, pharmacy: false, lab: true,
    staff: false, analytics: false, settings: false
  };
  const pharmacist: StaffPermissions = {
    dashboard: true, patients: false, doctors: false, appointments: false,
    prescriptions: true, billing: false, pharmacy: true, lab: false,
    staff: false, analytics: false, settings: false
  };
  const labTech: StaffPermissions = {
    dashboard: true, patients: false, doctors: false, appointments: false,
    prescriptions: false, billing: false, pharmacy: false, lab: true,
    staff: false, analytics: false, settings: false
  };
  const accountant: StaffPermissions = {
    dashboard: true, patients: false, doctors: false, appointments: false,
    prescriptions: false, billing: true, pharmacy: false, lab: false,
    staff: false, analytics: true, settings: false
  };
  switch (roleName) {
    case 'Owner': return allTrue;
    case 'Admin': case 'Administrator': return allTrue;
    case 'Doctor': return doctor;
    case 'Nurse': return doctor;
    case 'Receptionist': return receptionist;
    case 'Pharmacist': return pharmacist;
    case 'Lab Technician': return labTech;
    case 'Accountant': return accountant;
    default: return receptionist;
  }
};
