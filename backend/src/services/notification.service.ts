import { Notification } from '../models/Notification';
import { Clinic } from '../models/Clinic';

const DEFAULT_NOTIF_PREFERENCES = {
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

export class NotificationService {
  static async listNotifications(clinicId: any) {
    if (!clinicId) return [];
    return Notification.find({ clinicId }).sort({ createdAt: -1 });
  }

  static async createNotification(
    clinicId: any,
    data: { category: string; title: string; message: string; priority?: string; actionUrl?: string; userId?: string }
  ) {
    if (!clinicId) return null;
    try {
      return await Notification.create({
        clinicId,
        userId: data.userId,
        category: data.category as any,
        title: data.title,
        message: data.message,
        priority: (data.priority as any) || 'medium',
        actionUrl: data.actionUrl,
        read: false
      }, clinicId);
    } catch (err) {
      console.error('[NotificationService] Error creating notification:', err);
      return null;
    }
  }

  static async markRead(clinicId: any, notificationId: string) {
    if (!clinicId || !notificationId) return null;
    return Notification.findOneAndUpdate(
      { _id: notificationId, clinicId },
      { read: true },
      { new: true }
    );
  }

  static async markAllRead(clinicId: any) {
    if (!clinicId) return { success: false };
    await Notification.updateMany({ clinicId, read: false }, { read: true });
    return { success: true };
  }

  static async deleteNotification(clinicId: any, notificationId: string) {
    if (!clinicId || !notificationId) return { success: false };
    await Notification.findOneAndDelete({ _id: notificationId, clinicId });
    return { success: true };
  }

  static async getPreferences(clinicId: string, userId?: string) {
    if (!clinicId) return DEFAULT_NOTIF_PREFERENCES;
    try {
      const clinic = await Clinic.findById(clinicId);
      const savedPrefs = clinic?.address?.settings?.notifPrefs;
      return { ...DEFAULT_NOTIF_PREFERENCES, ...(savedPrefs || {}) };
    } catch (e) {
      return DEFAULT_NOTIF_PREFERENCES;
    }
  }

  static async updatePreferences(clinicId: string, userId: string, prefs: any) {
    if (!clinicId) return DEFAULT_NOTIF_PREFERENCES;
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) return DEFAULT_NOTIF_PREFERENCES;

    const currentAddr = clinic.address || {};
    const currentSettings = currentAddr.settings || {};
    const mergedPrefs = { ...DEFAULT_NOTIF_PREFERENCES, ...(currentSettings.notifPrefs || {}), ...prefs };

    await Clinic.findByIdAndUpdate(
      clinicId,
      {
        address: {
          ...currentAddr,
          settings: {
            ...currentSettings,
            notifPrefs: mergedPrefs
          }
        }
      },
      { new: true }
    );

    return mergedPrefs;
  }
}
