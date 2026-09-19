import { Staff } from '../models/Staff';
import { AuditLog } from '../models/AuditLog';
import { NotificationService } from './notification.service';

export class StaffService {
  static async listStaff(clinicId: any) {
    return Staff.find({ clinicId }).sort({ createdAt: -1 });
  }

  static async createStaff(clinicId: any, userId: string, userEmail: string, data: any) {
    const staff = await Staff.create({
      clinicId,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      roleName: data.roleName || 'Receptionist',
      department: data.department || 'General Medicine',
      designation: data.designation || 'Medical Staff',
      status: data.status || 'Active',
      permissions: data.permissions || {}
    }, clinicId);

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'STAFF_PROVISIONED',
      resource: 'Staff',
      details: { staffName: staff.name, roleName: staff.roleName }
    }, clinicId).catch(() => {});

    await NotificationService.createNotification(clinicId, {
      category: 'System',
      title: 'Staff Member Added',
      message: `Staff account provisioned for ${staff.name} (${staff.roleName} - ${staff.department}).`,
      priority: 'medium',
      actionUrl: '/staff'
    });

    return staff;
  }

  static async updateStaff(clinicId: any, staffId: string, userId: string, userEmail: string, data: any) {
    const cleanData = { ...data };
    delete cleanData.clinicId;
    delete cleanData.clinic_id;
    delete cleanData.id;
    delete cleanData._id;

    const staff = await Staff.findOneAndUpdate({ _id: staffId, clinicId }, cleanData, { new: true });
    if (!staff) throw { statusCode: 404, message: 'Staff record not found.' };

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'STAFF_UPDATED',
      resource: 'Staff',
      details: { staffName: staff.name, roleName: staff.roleName }
    }, clinicId).catch(() => {});

    await NotificationService.createNotification(clinicId, {
      category: 'System',
      title: 'Staff Record Updated',
      message: `Role permissions & operational details updated for ${staff.name} (${staff.roleName}).`,
      priority: cleanData.permissions ? 'high' : 'low',
      actionUrl: '/staff'
    });

    return staff;
  }

  static async deleteStaff(clinicId: any, staffId: string, userId: string, userEmail: string) {
    const staff = await Staff.findOneAndDelete({ _id: staffId, clinicId });
    if (!staff) throw { statusCode: 404, message: 'Staff record not found.' };

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'STAFF_DELETED',
      resource: 'Staff',
      details: { staffName: staff.name }
    }, clinicId).catch(() => {});

    await NotificationService.createNotification(clinicId, {
      category: 'System',
      title: 'Staff Member Removed',
      message: `Staff member ${staff.name} (${staff.roleName}) was removed from clinic access.`,
      priority: 'medium',
      actionUrl: '/staff'
    });

    return staff;
  }
}
