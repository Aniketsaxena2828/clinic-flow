import crypto from 'crypto';

export interface DemoSessionData {
  sessionId: string;
  createdAt: number;
  clinic: any;
  users: any[];
  patients: any[];
  doctors: any[];
  appointments: any[];
  bills: any[];
  prescriptions: any[];
  pharmacy: any[];
  lab: any[];
  staff: any[];
  notifications: any[];
  auditLogs: any[];
  settings: any;
}

const DEFAULT_OPERATING_HOURS = {
  monday: { enabled: true, openTime: '08:00', closeTime: '20:00', breakStart: '13:00', breakEnd: '14:00' },
  tuesday: { enabled: true, openTime: '08:00', closeTime: '20:00', breakStart: '13:00', breakEnd: '14:00' },
  wednesday: { enabled: true, openTime: '08:00', closeTime: '20:00', breakStart: '13:00', breakEnd: '14:00' },
  thursday: { enabled: true, openTime: '08:00', closeTime: '20:00', breakStart: '13:00', breakEnd: '14:00' },
  friday: { enabled: true, openTime: '08:00', closeTime: '20:00', breakStart: '13:00', breakEnd: '14:00' },
  saturday: { enabled: true, openTime: '09:00', closeTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
  sunday: { enabled: false, openTime: '09:00', closeTime: '13:00' }
};

export const createDefaultDemoSession = (sessionId: string): DemoSessionData => {
  const todayStr = new Date().toISOString().split('T')[0];

  const clinic = {
    id: sessionId,
    _id: sessionId,
    name: 'LifeCare Multi-Specialty Clinic',
    code: 'demo-clinic',
    email: 'contact@democlinic.com',
    phone: '+1-800-555-0100',
    subscriptionTier: 'professional',
    status: 'active',
    gstNumber: '27AAAAA0000A1Z5',
    logoUrl: '',
    address: {
      street: '100 Healthcare Boulevard',
      city: 'Metropolis',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      website: 'https://democlinic.com',
      registrationNumber: 'MED-NY-2024-001',
      description: 'Premier multi-specialty healthcare and diagnostic center providing compassionate outpatient care.'
    },
    workingHours: DEFAULT_OPERATING_HOURS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const users = [
    {
      id: `usr_owner_${sessionId}`,
      _id: `usr_owner_${sessionId}`,
      clinicId: sessionId,
      name: 'Dr. Robert Ford (Owner)',
      email: 'owner@democlinic.com',
      roleName: 'Owner',
      status: 'active',
      phone: '+1-800-555-0101',
      createdAt: new Date().toISOString()
    },
    {
      id: `usr_doc_${sessionId}`,
      _id: `usr_doc_${sessionId}`,
      clinicId: sessionId,
      name: 'Dr. Sarah Connor (Cardiology)',
      email: 'doctor@democlinic.com',
      roleName: 'Doctor',
      status: 'active',
      phone: '+1-800-555-0102',
      createdAt: new Date().toISOString()
    },
    {
      id: `usr_rec_${sessionId}`,
      _id: `usr_rec_${sessionId}`,
      clinicId: sessionId,
      name: 'Elena Rostova (Reception)',
      email: 'reception@democlinic.com',
      roleName: 'Receptionist',
      status: 'active',
      phone: '+1-800-555-0103',
      createdAt: new Date().toISOString()
    }
  ];

  const doctors = [
    {
      id: `doc_1_${sessionId}`,
      _id: `doc_1_${sessionId}`,
      clinicId: sessionId,
      name: 'Dr. Sarah Connor',
      email: 'doctor@democlinic.com',
      phone: '+1-800-555-0102',
      specialization: 'Cardiology & Internal Medicine',
      experienceYears: 12,
      consultationFee: 75,
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      slotDurationMinutes: 20,
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: `doc_2_${sessionId}`,
      _id: `doc_2_${sessionId}`,
      clinicId: sessionId,
      name: 'Dr. Michael Chen',
      email: 'dr.chen@democlinic.com',
      phone: '+1-800-555-0104',
      specialization: 'Dental Surgery & Orthodontics',
      experienceYears: 8,
      consultationFee: 60,
      availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
      slotDurationMinutes: 30,
      status: 'active',
      createdAt: new Date().toISOString()
    }
  ];

  const patients = [
    {
      id: `pat_1_${sessionId}`,
      _id: `pat_1_${sessionId}`,
      clinicId: sessionId,
      patientId: 'PAT-1001',
      name: 'Rahul Sharma',
      email: 'rahul.s@example.com',
      phone: '+1-555-0191',
      gender: 'Male',
      age: 34,
      bloodGroup: 'A+',
      address: { city: 'Metropolis', state: 'NY' },
      emergencyContact: { name: 'Priya Sharma', relationship: 'Spouse', phone: '+1-555-0192' },
      medicalHistory: ['Hypertension', 'Mild Asthma'],
      allergies: ['Penicillin'],
      createdAt: new Date().toISOString()
    },
    {
      id: `pat_2_${sessionId}`,
      _id: `pat_2_${sessionId}`,
      clinicId: sessionId,
      patientId: 'PAT-1002',
      name: 'Anita Patel',
      email: 'anita.p@example.com',
      phone: '+1-555-0193',
      gender: 'Female',
      age: 28,
      bloodGroup: 'O+',
      address: { city: 'Metropolis', state: 'NY' },
      emergencyContact: { name: 'Vikram Patel', relationship: 'Father', phone: '+1-555-0194' },
      medicalHistory: ['Dental Cavities'],
      allergies: ['Sulfa drugs'],
      createdAt: new Date().toISOString()
    },
    {
      id: `pat_3_${sessionId}`,
      _id: `pat_3_${sessionId}`,
      clinicId: sessionId,
      patientId: 'PAT-1003',
      name: 'David Miller',
      email: 'david.m@example.com',
      phone: '+1-555-0195',
      gender: 'Male',
      age: 52,
      bloodGroup: 'B+',
      address: { city: 'Metropolis', state: 'NY' },
      emergencyContact: { name: 'Sarah Miller', relationship: 'Daughter', phone: '+1-555-0196' },
      medicalHistory: ['Type 2 Diabetes'],
      allergies: [],
      createdAt: new Date().toISOString()
    }
  ];

  const appointments = [
    {
      id: `apt_1_${sessionId}`,
      _id: `apt_1_${sessionId}`,
      clinicId: sessionId,
      appointmentId: 'APT-1001',
      patientId: `pat_1_${sessionId}`,
      patientName: 'Rahul Sharma',
      patientPhone: '+1-555-0191',
      doctorId: `doc_1_${sessionId}`,
      doctorName: 'Dr. Sarah Connor',
      tokenNumber: 1,
      date: todayStr,
      timeSlot: '09:30 AM',
      type: 'In-person',
      status: 'In Consultation',
      reasonForVisit: 'Routine Blood Pressure & Cardio Checkup',
      paymentStatus: 'Paid',
      createdAt: new Date().toISOString()
    },
    {
      id: `apt_2_${sessionId}`,
      _id: `apt_2_${sessionId}`,
      clinicId: sessionId,
      appointmentId: 'APT-1002',
      patientId: `pat_2_${sessionId}`,
      patientName: 'Anita Patel',
      patientPhone: '+1-555-0193',
      doctorId: `doc_2_${sessionId}`,
      doctorName: 'Dr. Michael Chen',
      tokenNumber: 1,
      date: todayStr,
      timeSlot: '10:15 AM',
      type: 'In-person',
      status: 'Scheduled',
      reasonForVisit: 'Tooth Sensitivity & Dental Scaling',
      paymentStatus: 'Pending',
      createdAt: new Date().toISOString()
    }
  ];

  const pharmacy = [
    {
      id: `med_1_${sessionId}`,
      _id: `med_1_${sessionId}`,
      clinicId: sessionId,
      name: 'Augmentin 625 Duo',
      genericName: 'Amoxicillin + Clavulanic Acid',
      category: 'Antibiotics',
      stockQuantity: 340,
      reorderLevel: 20,
      minStockAlert: 20,
      unitPrice: 22.5,
      batchNumber: 'B-9921',
      expiryDate: '2027-12-31',
      createdAt: new Date().toISOString()
    },
    {
      id: `med_2_${sessionId}`,
      _id: `med_2_${sessionId}`,
      clinicId: sessionId,
      name: 'Montair-LC Tab',
      genericName: 'Montelukast + Levocetirizine',
      category: 'Antiallergics',
      stockQuantity: 18,
      reorderLevel: 20,
      minStockAlert: 20,
      unitPrice: 15.0,
      batchNumber: 'M-4412',
      expiryDate: '2026-11-30',
      createdAt: new Date().toISOString()
    },
    {
      id: `med_3_${sessionId}`,
      _id: `med_3_${sessionId}`,
      clinicId: sessionId,
      name: 'Pan-D Capsule',
      genericName: 'Pantoprazole + Domperidone',
      category: 'Gastrointestinal',
      stockQuantity: 520,
      reorderLevel: 20,
      minStockAlert: 20,
      unitPrice: 18.0,
      batchNumber: 'P-1088',
      expiryDate: '2027-08-31',
      createdAt: new Date().toISOString()
    }
  ];

  const lab = [
    {
      id: `lab_1_${sessionId}`,
      _id: `lab_1_${sessionId}`,
      clinicId: sessionId,
      orderId: 'LAB-1001',
      testName: 'Complete Blood Count (CBC) Panel',
      category: 'Hematology',
      patientId: `pat_1_${sessionId}`,
      patientName: 'Rahul Sharma',
      patientPhone: '+1-555-0191',
      doctorId: `doc_1_${sessionId}`,
      doctorName: 'Dr. Sarah Connor',
      sampleType: 'Whole Blood EDTA',
      status: 'Processing',
      price: 450,
      createdAt: new Date().toISOString()
    },
    {
      id: `lab_2_${sessionId}`,
      _id: `lab_2_${sessionId}`,
      clinicId: sessionId,
      orderId: 'LAB-1002',
      testName: 'Lipid Profile Comprehensive',
      category: 'Biochemistry',
      patientId: `pat_3_${sessionId}`,
      patientName: 'David Miller',
      patientPhone: '+1-555-0195',
      doctorId: `doc_1_${sessionId}`,
      doctorName: 'Dr. Sarah Connor',
      sampleType: 'Serum (Fasting)',
      status: 'Result Ready',
      price: 650,
      createdAt: new Date().toISOString()
    }
  ];

  const prescriptions = [
    {
      id: `rx_1_${sessionId}`,
      _id: `rx_1_${sessionId}`,
      clinicId: sessionId,
      rxNumber: 'RX-2026-001',
      appointmentId: `apt_1_${sessionId}`,
      patientId: `pat_1_${sessionId}`,
      patientName: 'Rahul Sharma',
      doctorId: `doc_1_${sessionId}`,
      doctorName: 'Dr. Sarah Connor',
      diagnosis: 'Acute Rhinopharyngitis with mild bronchospasm',
      medications: [
        {
          name: 'Augmentin 625 Duo',
          dosage: '1 tablet',
          frequency: '1-0-1',
          duration: '5 days',
          instructions: 'After food with warm water'
        },
        {
          name: 'Montair-LC',
          dosage: '1 tablet',
          frequency: '0-0-1',
          duration: '7 days',
          instructions: 'At bedtime'
        }
      ],
      createdAt: new Date().toISOString()
    }
  ];

  const bills = [
    {
      id: `bill_1_${sessionId}`,
      _id: `bill_1_${sessionId}`,
      clinicId: sessionId,
      invoiceNumber: 'INV-2026-101',
      patientId: `pat_1_${sessionId}`,
      patientName: 'Rahul Sharma',
      appointmentId: `apt_1_${sessionId}`,
      subtotal: 1250,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 1250,
      paidAmount: 1250,
      balanceDue: 0,
      status: 'Paid',
      paymentMethod: 'UPI',
      createdAt: new Date().toISOString()
    },
    {
      id: `bill_2_${sessionId}`,
      _id: `bill_2_${sessionId}`,
      clinicId: sessionId,
      invoiceNumber: 'INV-2026-102',
      patientId: `pat_2_${sessionId}`,
      patientName: 'Anita Patel',
      appointmentId: `apt_2_${sessionId}`,
      subtotal: 600,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 600,
      paidAmount: 0,
      balanceDue: 600,
      status: 'Pending',
      paymentMethod: 'Cash',
      createdAt: new Date().toISOString()
    }
  ];

  const staff = [
    {
      id: `stf_1_${sessionId}`,
      _id: `stf_1_${sessionId}`,
      clinicId: sessionId,
      name: 'Dr. Robert Ford',
      email: 'owner@democlinic.com',
      phone: '+1-800-555-0101',
      roleName: 'Owner',
      department: 'Management',
      designation: 'Clinic Director',
      status: 'Active',
      createdAt: new Date().toISOString()
    },
    {
      id: `stf_2_${sessionId}`,
      _id: `stf_2_${sessionId}`,
      clinicId: sessionId,
      name: 'Dr. Sarah Connor',
      email: 'doctor@democlinic.com',
      phone: '+1-800-555-0102',
      roleName: 'Doctor',
      department: 'Cardiology',
      designation: 'Senior Consultant',
      status: 'Active',
      createdAt: new Date().toISOString()
    },
    {
      id: `stf_3_${sessionId}`,
      _id: `stf_3_${sessionId}`,
      clinicId: sessionId,
      name: 'Elena Rostova',
      email: 'reception@democlinic.com',
      phone: '+1-800-555-0103',
      roleName: 'Receptionist',
      department: 'Front Desk',
      designation: 'Lead Receptionist',
      status: 'Active',
      createdAt: new Date().toISOString()
    }
  ];

  const notifications = [
    {
      id: `notif_1_${sessionId}`,
      _id: `notif_1_${sessionId}`,
      clinicId: sessionId,
      category: 'Appointment',
      title: 'Consultation In Progress',
      message: 'Rahul Sharma is currently in consultation with Dr. Sarah Connor.',
      priority: 'low',
      read: false,
      createdAt: new Date().toISOString()
    },
    {
      id: `notif_2_${sessionId}`,
      _id: `notif_2_${sessionId}`,
      clinicId: sessionId,
      category: 'Pharmacy',
      title: 'Low Stock Alert',
      message: 'Montair-LC Tab has reached reorder threshold (18 remaining).',
      priority: 'medium',
      read: false,
      createdAt: new Date().toISOString()
    }
  ];

  const settings = {
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
    operatingHours: DEFAULT_OPERATING_HOURS,
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
      labContactPhone: '+1-800-555-0100',
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
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD-MM-YYYY',
      timeFormat: '12-hour',
      twoFactorAuth: false,
      ipWhitelistEnabled: false
    },
    tenant: {
      tenantId: sessionId,
      tenantCode: 'demo-clinic',
      subscriptionPlan: 'professional',
      subscriptionStatus: 'active'
    }
  };

  return {
    sessionId,
    createdAt: Date.now(),
    clinic,
    users,
    patients,
    doctors,
    appointments,
    bills,
    prescriptions,
    pharmacy,
    lab,
    staff,
    notifications,
    auditLogs: [],
    settings
  };
};

export class DemoStore {
  private static sessions: Map<string, DemoSessionData> = new Map();

  static isDemoSession(clinicId?: string): boolean {
    if (!clinicId) return false;
    return clinicId.startsWith('demo_') || clinicId === 'demo-clinic';
  }

  static getOrCreateSession(sessionId: string): DemoSessionData {
    // If exact session exists, return it
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }

    // Auto-clean expired sessions (older than 4 hours)
    const now = Date.now();
    for (const [key, session] of this.sessions.entries()) {
      if (now - session.createdAt > 4 * 60 * 60 * 1000) {
        this.sessions.delete(key);
      }
    }

    // Create fresh default session
    const newSession = createDefaultDemoSession(sessionId);
    this.sessions.set(sessionId, newSession);
    return newSession;
  }

  static destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  // Generic Query Helper
  static getCollection(sessionId: string, tableName: string): any[] {
    const session = this.getOrCreateSession(sessionId);
    switch (tableName) {
      case 'patients': return session.patients;
      case 'doctors': return session.doctors;
      case 'appointments': return session.appointments;
      case 'bills': return session.bills;
      case 'prescriptions': return session.prescriptions;
      case 'pharmacy_items': return session.pharmacy;
      case 'lab_orders': return session.lab;
      case 'staff': return session.staff;
      case 'notifications': return session.notifications;
      case 'audit_logs': return session.auditLogs;
      case 'users': return session.users;
      default: return [];
    }
  }

  static filterItems(items: any[], filter: Record<string, any>): any[] {
    return items.filter(item => {
      for (const [key, val] of Object.entries(filter)) {
        if (key === 'clinicId' || key === 'clinic_id') continue;
        if (val === undefined || val === null) continue;

        const itemVal = item[key] !== undefined ? item[key] : (item[toCamel(key)] !== undefined ? item[toCamel(key)] : item[toSnake(key)]);

        if (key === '_id' || key === 'id') {
          const idVal = item.id || item._id;
          if (String(idVal) !== String(val)) return false;
          continue;
        }

        if (typeof val === 'object' && !(val instanceof Date)) {
          if (val.$regex) {
            const regex = new RegExp(val.$regex, 'i');
            if (!regex.test(String(itemVal || ''))) return false;
          } else if (val.$in && Array.isArray(val.$in)) {
            if (!val.$in.map(String).includes(String(itemVal))) return false;
          } else if (val.$ne !== undefined) {
            if (String(itemVal) === String(val.$ne)) return false;
          }
        } else {
          if (String(itemVal) !== String(val)) return false;
        }
      }
      return true;
    });
  }

  static find(tableName: string, filter: Record<string, any>, sessionId: string): any[] {
    const items = this.getCollection(sessionId, tableName);
    return this.filterItems(items, filter);
  }

  static findOne(tableName: string, filter: Record<string, any>, sessionId: string): any | null {
    if (tableName === 'clinics') {
      const session = this.getOrCreateSession(sessionId);
      return { ...session.clinic };
    }
    const items = this.find(tableName, filter, sessionId);
    return items.length > 0 ? { ...items[0] } : null;
  }

  static findById(tableName: string, id: string, sessionId: string): any | null {
    if (tableName === 'clinics') {
      const session = this.getOrCreateSession(sessionId);
      return { ...session.clinic };
    }
    const items = this.getCollection(sessionId, tableName);
    const found = items.find(item => (item.id === id || item._id === id));
    return found ? { ...found } : null;
  }

  static create(tableName: string, data: any, sessionId: string): any {
    const session = this.getOrCreateSession(sessionId);
    const collection = this.getCollection(sessionId, tableName);
    const id = data.id || data._id || `demo_${tableName.slice(0, 3)}_${crypto.randomUUID()}`;
    const newItem = {
      ...data,
      id,
      _id: id,
      clinicId: sessionId,
      clinic_id: sessionId,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    collection.unshift(newItem);
    return { ...newItem };
  }

  static findByIdAndUpdate(tableName: string, id: string, update: any, sessionId: string): any | null {
    if (tableName === 'clinics') {
      const session = this.getOrCreateSession(sessionId);
      const rawUpdate = update.$set ? { ...update, ...update.$set } : update;
      delete rawUpdate.$set;
      Object.assign(session.clinic, rawUpdate, { updatedAt: new Date().toISOString() });
      return { ...session.clinic };
    }

    const collection = this.getCollection(sessionId, tableName);
    const index = collection.findIndex(item => (item.id === id || item._id === id));
    if (index === -1) return null;

    const rawUpdate = update.$set ? { ...update, ...update.$set } : update;
    delete rawUpdate.$set;

    collection[index] = {
      ...collection[index],
      ...rawUpdate,
      updatedAt: new Date().toISOString()
    };
    return { ...collection[index] };
  }

  static findByIdAndDelete(tableName: string, id: string, sessionId: string): any | null {
    const collection = this.getCollection(sessionId, tableName);
    const index = collection.findIndex(item => (item.id === id || item._id === id));
    if (index === -1) return null;
    const [deleted] = collection.splice(index, 1);
    return deleted;
  }

  static countDocuments(tableName: string, filter: Record<string, any>, sessionId: string): number {
    return this.find(tableName, filter, sessionId).length;
  }

  static getSettings(sessionId: string): any {
    const session = this.getOrCreateSession(sessionId);
    return {
      ...session.settings,
      clinicName: session.clinic.name || session.settings.clinicName,
      phone: session.clinic.phone || session.settings.phone,
      email: session.clinic.email || session.settings.email,
      gstin: session.clinic.gstNumber || session.settings.gstin,
      operatingHours: session.clinic.workingHours || session.settings.operatingHours
    };
  }

  static updateSettings(sessionId: string, data: any): any {
    const session = this.getOrCreateSession(sessionId);
    if (data.clinicName !== undefined || data.name !== undefined) {
      session.clinic.name = data.clinicName !== undefined ? data.clinicName : data.name;
    }
    if (data.phone !== undefined) session.clinic.phone = data.phone;
    if (data.email !== undefined) session.clinic.email = data.email;
    if (data.gstin !== undefined || data.gstNumber !== undefined) {
      session.clinic.gstNumber = data.gstin !== undefined ? data.gstin : data.gstNumber;
    }
    if (data.operatingHours !== undefined) session.clinic.workingHours = data.operatingHours;

    session.settings = {
      ...session.settings,
      ...data,
      clinicName: session.clinic.name,
      phone: session.clinic.phone,
      email: session.clinic.email,
      gstin: session.clinic.gstNumber
    };
    return this.getSettings(sessionId);
  }
}

const toCamel = (str: string): string => str.replace(/_([a-z0-9])/g, (_, l) => l.toUpperCase());
const toSnake = (str: string): string => str.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
