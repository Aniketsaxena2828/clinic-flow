import { Prescription } from '../models/Prescription';
import { AuditLog } from '../models/AuditLog';
import { NotificationService } from './notification.service';

export class PrescriptionService {
  static async listPrescriptions(clinicId: any) {
    return Prescription.find({ clinicId }).sort({ createdAt: -1 });
  }

  static async createPrescription(clinicId: any, userId: string, userEmail: string, data: any) {
    const rx = await Prescription.create({
      clinicId,
      patientId: data.patientId,
      patientName: data.patientName,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      doctorSpecialization: data.doctorSpecialization,
      diagnosis: data.diagnosis,
      symptoms: data.symptoms || [],
      vitals: data.vitals || {},
      medicines: data.medicines || [],
      advice: data.advice,
      followUpDate: data.followUpDate,
      status: data.status || 'Active'
    }, clinicId);

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'PRESCRIPTION_CREATED',
      resource: 'Prescription',
      details: { rxId: rx._id, patientName: rx.patientName, doctorName: rx.doctorName }
    }, clinicId).catch(() => {});

    await NotificationService.createNotification(clinicId, {
      category: 'Prescriptions',
      title: 'New Prescription Issued',
      message: `Prescription issued for ${rx.patientName || 'Patient'} by ${rx.doctorName || 'Attending Doctor'} (${rx.diagnosis || 'Clinical Rx'}).`,
      priority: 'medium',
      actionUrl: '/prescriptions'
    });

    return rx;
  }

  static async updatePrescription(clinicId: any, rxId: string, userId: string, userEmail: string, data: any) {
    const cleanData = { ...data };
    delete cleanData.clinicId;
    delete cleanData.clinic_id;
    delete cleanData.id;
    delete cleanData._id;

    const rx = await Prescription.findOneAndUpdate({ _id: rxId, clinicId }, cleanData, { new: true });
    if (!rx) throw { statusCode: 404, message: 'Prescription not found' };

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'PRESCRIPTION_UPDATED',
      resource: 'Prescription',
      details: { rxId: rx._id }
    }, clinicId).catch(() => {});

    await NotificationService.createNotification(clinicId, {
      category: 'Prescriptions',
      title: 'Prescription Updated',
      message: `Prescription advice & medication details updated for ${rx.patientName || 'Patient'}.`,
      priority: 'low',
      actionUrl: '/prescriptions'
    });

    return rx;
  }
}
