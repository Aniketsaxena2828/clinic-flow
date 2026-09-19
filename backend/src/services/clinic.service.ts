import { Clinic } from '../models/Clinic';
import { AuditLog } from '../models/AuditLog';
import { NotificationService } from './notification.service';
import { DemoStore } from '../utils/demoStore';

const DEFAULT_OPERATING_HOURS = {
  monday: { enabled: true, openTime: '08:00', closeTime: '20:00', breakStart: '13:00', breakEnd: '14:00' },
  tuesday: { enabled: true, openTime: '08:00', closeTime: '20:00', breakStart: '13:00', breakEnd: '14:00' },
  wednesday: { enabled: true, openTime: '08:00', closeTime: '20:00', breakStart: '13:00', breakEnd: '14:00' },
  thursday: { enabled: true, openTime: '08:00', closeTime: '20:00', breakStart: '13:00', breakEnd: '14:00' },
  friday: { enabled: true, openTime: '08:00', closeTime: '20:00', breakStart: '13:00', breakEnd: '14:00' },
  saturday: { enabled: true, openTime: '09:00', closeTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
  sunday: { enabled: false, openTime: '09:00', closeTime: '13:00' }
};

const DEFAULT_APPOINTMENT_SETTINGS = {
  defaultDurationMinutes: 15,
  bufferMinutes: 5,
  allowFutureBooking: true,
  maxFutureDays: 30,
  allowSameDay: true,
  allowDoubleBooking: false,
  cancellationPolicy: 'Cancellations allowed up to 2 hours prior to scheduled appointment slot.'
};

const DEFAULT_BILLING_SETTINGS = {
  currency: 'INR',
  currencySymbol: '₹',
  gstEnabled: true,
  defaultGstRate: 18,
  invoicePrefix: 'INV-2026-',
  nextInvoiceNumber: 105,
  paymentMethods: ['Cash', 'UPI', 'Card', 'Bank Transfer']
};

const DEFAULT_PRESCRIPTION_SETTINGS = {
  rxPrefix: 'RX-2026-',
  doctorSignatureText: 'Authorized Medical Officer Signature',
  defaultAdviceText: 'Take prescribed medication after meals with warm water. Rest adequately.',
  displayClinicHeader: true,
  followUpDefaultDays: 7
};

const DEFAULT_PHARMACY_SETTINGS = {
  lowStockThreshold: 20,
  expiryWarningDays: 90,
  defaultMedicineTaxRate: 12,
  categories: ['Analgesics', 'Antibiotics', 'Antidiabetics', 'Cardiovascular', 'Vitamins & Supplements', 'Dermatological']
};

const DEFAULT_LAB_SETTINGS = {
  labName: 'Apex Central Pathology & Radiology Diagnostics',
  labContactPhone: '+91 98765 00099',
  reportPrefix: 'LAB-2026-',
  pathologistName: 'Dr. Anita Roy',
  pathologistTitle: 'MD (Pathology), Lead Consultant',
  categories: ['Hematology', 'Biochemistry', 'Serology', 'Microbiology', 'Radiology']
};

const DEFAULT_NOTIFICATIONS_SETTINGS = {
  emailAlerts: true,
  smsAlerts: true,
  appointmentReminders: true,
  lowStockAlerts: true,
  labResultAlerts: true,
  billingPaymentAlerts: true
};

const DEFAULT_SECURITY_SETTINGS = {
  sessionTimeoutMinutes: 60,
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD-MM-YYYY',
  timeFormat: '12-hour',
  twoFactorAuth: false,
  ipWhitelistEnabled: false
};

export class ClinicService {
  static async getClinicProfile(clinicId: string) {
    if (DemoStore.isDemoSession(clinicId)) {
      return DemoStore.getOrCreateSession(clinicId).clinic;
    }
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      throw { statusCode: 404, message: 'Clinic not found' };
    }
    return clinic;
  }

  static async getClinicSettings(clinicId: string) {
    if (DemoStore.isDemoSession(clinicId)) {
      return DemoStore.getSettings(clinicId);
    }

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      throw { statusCode: 404, message: 'Clinic not found' };
    }

    const addr = clinic.address || {};
    const nestedSettings = addr.settings || {};

    const fullSettings = {
      clinicName: clinic.name || 'LifeCare Multi-Specialty Clinic',
      clinicLogoUrl: clinic.logoUrl || '',
      phone: clinic.phone || '+1-800-555-0100',
      email: clinic.email || 'contact@democlinic.com',
      website: addr.website || 'https://democlinic.com',
      address: addr.street || addr.address || '100 Healthcare Boulevard',
      city: addr.city || 'Metropolis',
      state: addr.state || 'NY',
      country: addr.country || 'USA',
      postalCode: addr.postalCode || addr.zipCode || '10001',
      gstin: clinic.gstNumber || '27AAAAA0000A1Z5',
      registrationNumber: addr.registrationNumber || 'MED-NY-2024-001',
      description: addr.description || 'Premier multi-specialty healthcare and diagnostic center providing compassionate outpatient care.',
      operatingHours: clinic.workingHours && typeof clinic.workingHours === 'object' && Object.keys(clinic.workingHours).length > 3
        ? clinic.workingHours
        : DEFAULT_OPERATING_HOURS,
      appointment: { ...DEFAULT_APPOINTMENT_SETTINGS, ...(nestedSettings.appointment || {}) },
      billing: { ...DEFAULT_BILLING_SETTINGS, ...(nestedSettings.billing || {}) },
      prescription: { ...DEFAULT_PRESCRIPTION_SETTINGS, ...(nestedSettings.prescription || {}) },
      pharmacy: { ...DEFAULT_PHARMACY_SETTINGS, ...(nestedSettings.pharmacy || {}) },
      lab: { ...DEFAULT_LAB_SETTINGS, ...(nestedSettings.lab || {}) },
      notifications: { ...DEFAULT_NOTIFICATIONS_SETTINGS, ...(nestedSettings.notifications || {}) },
      security: { ...DEFAULT_SECURITY_SETTINGS, ...(nestedSettings.security || {}) },
      tenant: {
        tenantId: clinic.id || clinic._id || clinicId,
        tenantCode: clinic.code || 'apex-health',
        subscriptionPlan: clinic.subscriptionTier || 'professional',
        subscriptionStatus: clinic.status || 'active'
      }
    };

    return fullSettings;
  }

  static async updateClinicSettings(clinicId: string, userId: string, userEmail: string, data: any) {
    if (DemoStore.isDemoSession(clinicId)) {
      return DemoStore.updateSettings(clinicId, data);
    }

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      throw { statusCode: 404, message: 'Clinic not found' };
    }

    const currentAddr = clinic.address || {};
    const updatedAddress = {
      ...currentAddr,
      street: data.address !== undefined ? data.address : (currentAddr.street || currentAddr.address),
      address: data.address !== undefined ? data.address : (currentAddr.street || currentAddr.address),
      city: data.city !== undefined ? data.city : currentAddr.city,
      state: data.state !== undefined ? data.state : currentAddr.state,
      country: data.country !== undefined ? data.country : currentAddr.country,
      postalCode: data.postalCode !== undefined ? data.postalCode : currentAddr.postalCode,
      zipCode: data.postalCode !== undefined ? data.postalCode : currentAddr.zipCode,
      website: data.website !== undefined ? data.website : currentAddr.website,
      registrationNumber: data.registrationNumber !== undefined ? data.registrationNumber : currentAddr.registrationNumber,
      description: data.description !== undefined ? data.description : currentAddr.description,
      settings: {
        ...(currentAddr.settings || {}),
        appointment: data.appointment !== undefined ? data.appointment : currentAddr.settings?.appointment,
        billing: data.billing !== undefined ? data.billing : currentAddr.settings?.billing,
        prescription: data.prescription !== undefined ? data.prescription : currentAddr.settings?.prescription,
        pharmacy: data.pharmacy !== undefined ? data.pharmacy : currentAddr.settings?.pharmacy,
        lab: data.lab !== undefined ? data.lab : currentAddr.settings?.lab,
        notifications: data.notifications !== undefined ? data.notifications : currentAddr.settings?.notifications,
        security: data.security !== undefined ? data.security : currentAddr.settings?.security,
        notifPrefs: data.notifPrefs !== undefined ? data.notifPrefs : currentAddr.settings?.notifPrefs
      }
    };

    const updated = await Clinic.findByIdAndUpdate(
      clinicId,
      {
        name: data.clinicName !== undefined ? data.clinicName : (data.name !== undefined ? data.name : clinic.name),
        phone: data.phone !== undefined ? data.phone : clinic.phone,
        email: data.email !== undefined ? data.email : clinic.email,
        gstNumber: data.gstin !== undefined ? data.gstin : (data.gstNumber !== undefined ? data.gstNumber : clinic.gstNumber),
        logoUrl: data.clinicLogoUrl !== undefined ? data.clinicLogoUrl : (data.logoUrl !== undefined ? data.logoUrl : clinic.logoUrl),
        workingHours: data.operatingHours !== undefined ? data.operatingHours : (data.workingHours !== undefined ? data.workingHours : clinic.workingHours),
        address: updatedAddress
      },
      { new: true }
    );

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'CLINIC_SETTINGS_SAVED',
      resource: 'ClinicSettings',
      details: { updatedFields: Object.keys(data) }
    }).catch(() => {});

    await NotificationService.createNotification(clinicId, {
      category: 'System',
      title: 'Practice Settings Updated',
      message: 'Practice profile, configuration parameters, and module preferences were updated successfully.',
      priority: 'low',
      actionUrl: '/settings'
    });

    return this.getClinicSettings(clinicId);
  }

  static async updateClinicProfile(clinicId: string, userId: string, userEmail: string, data: any) {
    return this.updateClinicSettings(clinicId, userId, userEmail, data);
  }

  static async updateWorkingHours(clinicId: string, userId: string, userEmail: string, workingHours: any) {
    if (DemoStore.isDemoSession(clinicId)) {
      return DemoStore.updateSettings(clinicId, { operatingHours: workingHours });
    }

    const clinic = await Clinic.findByIdAndUpdate(
      clinicId,
      { workingHours },
      { new: true }
    );

    if (!clinic) {
      throw { statusCode: 404, message: 'Clinic not found' };
    }

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'WORKING_HOURS_UPDATED',
      resource: 'Clinic',
      details: workingHours
    }).catch(() => {});

    return clinic;
  }
}
