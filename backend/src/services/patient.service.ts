import { Patient } from '../models/Patient';
import { AuditLog } from '../models/AuditLog';
import { NotificationService } from './notification.service';

export class PatientService {
  /**
   * Helper to generate auto-incrementing tenant-scoped Patient ID (PAT-1001)
   */
  private static async generatePatientId(clinicId: string): Promise<string> {
    const count = await Patient.countDocuments({ clinicId });
    const nextSeq = count + 1001;
    return `PAT-${nextSeq}`;
  }

  static async listPatients(
    clinicId: string,
    query: { search?: string; bloodGroup?: string; gender?: string; page?: number; limit?: number }
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = { clinicId, status: 'active' };

    if (query.bloodGroup) {
      filter.bloodGroup = query.bloodGroup;
    }

    if (query.gender) {
      filter.gender = query.gender;
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
        { patientId: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } }
      ];
    }

    const [patients, total] = await Promise.all([
      Patient.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Patient.countDocuments(filter)
    ]);

    return {
      patients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async createPatient(clinicId: string, userId: string, userEmail: string, data: any) {
    if (!clinicId) {
      throw { statusCode: 400, message: 'Tenant clinic ID is required.' };
    }

    const generatedId = await this.generatePatientId(clinicId);

    const patient = await Patient.create({
      clinicId,
      patientId: data.patientId || generatedId,
      name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Registered Patient',
      email: data.email || undefined,
      phone: data.phone || '+91 98765 43210',
      gender: data.gender || 'Male',
      age: Number(data.age) || 30,
      dateOfBirth: data.dob || data.dateOfBirth ? new Date(data.dob || data.dateOfBirth) : undefined,
      bloodGroup: data.bloodGroup || 'O+',
      address: data.address,
      emergencyContact: data.emergencyContact,
      medicalHistory: data.medicalHistory || [],
      allergies: data.allergies || []
    }, clinicId);

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'PATIENT_CREATED',
      resource: 'Patient',
      details: { patientId: patient.patientId, name: patient.name }
    }, clinicId).catch(() => {});

    await NotificationService.createNotification(clinicId, {
      category: 'Patients',
      title: 'New Patient Registered',
      message: `Patient ${patient.name} (${patient.patientId || patient.phone}) was registered in clinic EHR.`,
      priority: 'low',
      actionUrl: '/patients'
    });

    return patient;
  }

  private static getPatientQuery(clinicId: string, id: string): any {
    if (!id || typeof id !== 'string' || id === '[object Object]' || !clinicId) {
      return null;
    }
    const isIdFormat = /^[0-9a-fA-F]{24}$/.test(id) || /^[0-9a-fA-F-]{36}$/.test(id);
    if (isIdFormat) {
      return { clinicId, $or: [{ _id: id }, { patientId: id }] };
    }
    return { clinicId, patientId: id };
  }

  static async getPatientById(clinicId: string, id: string) {
    const query = this.getPatientQuery(clinicId, id);
    if (!query) {
      throw { statusCode: 400, message: 'Invalid patient ID provided.' };
    }
    const patient = await Patient.findOne(query);
    if (!patient) {
      throw { statusCode: 404, message: 'Patient record not found.' };
    }
    return patient;
  }

  static async updatePatient(clinicId: string, id: string, userId: string, userEmail: string, data: any) {
    const query = this.getPatientQuery(clinicId, id);
    if (!query) {
      throw { statusCode: 400, message: 'Invalid patient ID provided.' };
    }

    const cleanData = { ...data };
    delete cleanData.clinicId;
    delete cleanData.clinic_id;
    delete cleanData.id;
    delete cleanData._id;

    const patient = await Patient.findOneAndUpdate(
      query,
      { $set: cleanData },
      { new: true, runValidators: true }
    );

    if (!patient) {
      throw { statusCode: 404, message: 'Patient record not found.' };
    }

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'PATIENT_UPDATED',
      resource: 'Patient',
      details: { patientId: patient.patientId }
    }, clinicId).catch(() => {});

    await NotificationService.createNotification(clinicId, {
      category: 'Patients',
      title: 'Patient Profile Updated',
      message: `Medical records & contact details updated for ${patient.name} (${patient.patientId}).`,
      priority: 'low',
      actionUrl: '/patients'
    });

    return patient;
  }

  static async addDocument(clinicId: string, id: string, userId: string, userEmail: string, documentData: { title: string; fileUrl: string; fileType?: string }) {
    const query = this.getPatientQuery(clinicId, id);
    if (!query) {
      throw { statusCode: 400, message: 'Invalid patient ID provided.' };
    }
    const patient = await Patient.findOne(query);
    if (!patient) {
      throw { statusCode: 404, message: 'Patient record not found.' };
    }

    patient.documents = patient.documents || [];
    patient.documents.push({
      title: documentData.title,
      fileUrl: documentData.fileUrl,
      fileType: documentData.fileType || 'application/pdf',
      uploadedAt: new Date()
    });

    await patient.save();

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'PATIENT_DOCUMENT_ATTACHED',
      resource: 'Patient',
      details: { patientId: patient.patientId, documentTitle: documentData.title }
    }, clinicId).catch(() => {});

    await NotificationService.createNotification(clinicId, {
      category: 'Patients',
      title: 'Medical Document Uploaded',
      message: `Document "${documentData.title}" attached to medical record for ${patient.name} (${patient.patientId}).`,
      priority: 'low',
      actionUrl: '/patients'
    });

    return patient;
  }

  static async archivePatient(clinicId: string, id: string, userId: string, userEmail: string) {
    const query = this.getPatientQuery(clinicId, id);
    if (!query) {
      throw { statusCode: 400, message: 'Invalid patient ID provided.' };
    }
    const patient = await Patient.findOneAndUpdate(
      query,
      { status: 'archived' },
      { new: true }
    );

    if (!patient) {
      throw { statusCode: 404, message: 'Patient record not found.' };
    }

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'PATIENT_ARCHIVED',
      resource: 'Patient',
      details: { patientId: patient.patientId }
    }, clinicId);

    return patient;
  }
}
