import { Doctor } from '../models/Doctor';
import { AuditLog } from '../models/AuditLog';

export class DoctorService {
  static async listDoctors(clinicId: string, query: { search?: string; status?: string; departmentId?: string }) {
    const filter: any = { clinicId };
    if (query.status) filter.status = query.status;
    if (query.departmentId) filter.departmentId = query.departmentId;

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { specialization: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } }
      ];
    }

    const doctors = await Doctor.find(filter).populate('departmentId', 'name code').sort({ name: 1 });
    return doctors;
  }

  static async createDoctor(clinicId: string, performedByUserId: string, performedByUserEmail: string, data: any) {
    const docEmail = (data.email || `doc_${Date.now()}@clinicflow.com`).toLowerCase();
    const existing = await Doctor.findOne({ clinicId, email: docEmail }).catch(() => null);
    if (existing) {
      throw { statusCode: 400, message: 'A doctor profile with this email already exists.' };
    }

    const doctor = await Doctor.create({
      clinicId,
      name: data.name || 'Dr. Practitioner',
      email: docEmail,
      phone: data.phone || '+91 98765 43210',
      departmentId: data.departmentId,
      departmentName: data.departmentName || 'General Medicine',
      specialization: data.specialization || 'General Medicine',
      experienceYears: Number(data.experienceYears) || 5,
      consultationFee: Number(data.consultationFee) || 500,
      availableDays: data.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      slotDurationMinutes: Number(data.slotDurationMinutes) || 20,
      status: data.status || 'active'
    }, clinicId);

    await AuditLog.create({
      clinicId,
      userId: performedByUserId,
      userEmail: performedByUserEmail,
      action: 'DOCTOR_PROFILE_CREATED',
      resource: 'Doctor',
      details: { doctorName: doctor.name, specialization: doctor.specialization }
    }, clinicId).catch(() => {});

    return doctor;
  }

  static async getDoctorById(clinicId: string, id: string) {
    const doctor = await Doctor.findOne({ _id: id, clinicId }).populate('departmentId');
    if (!doctor) {
      throw { statusCode: 404, message: 'Doctor profile not found.' };
    }
    return doctor;
  }

  static async updateDoctor(clinicId: string, id: string, performedByUserId: string, performedByUserEmail: string, data: any) {
    const cleanData = { ...data };
    delete cleanData.clinicId;
    delete cleanData.clinic_id;
    delete cleanData.id;
    delete cleanData._id;

    const doctor = await Doctor.findOneAndUpdate(
      { _id: id, clinicId },
      { $set: cleanData },
      { new: true, runValidators: true }
    );

    if (!doctor) {
      throw { statusCode: 404, message: 'Doctor profile not found.' };
    }

    await AuditLog.create({
      clinicId,
      userId: performedByUserId,
      userEmail: performedByUserEmail,
      action: 'DOCTOR_PROFILE_UPDATED',
      resource: 'Doctor',
      details: { doctorId: doctor._id }
    }, clinicId);

    return doctor;
  }

  static async deleteDoctor(clinicId: string, id: string, performedByUserId: string, performedByUserEmail: string) {
    const doctor = await Doctor.findOneAndDelete({ _id: id, clinicId });

    if (!doctor) {
      throw { statusCode: 404, message: 'Doctor profile not found or already deleted.' };
    }

    await AuditLog.create({
      clinicId,
      userId: performedByUserId,
      userEmail: performedByUserEmail,
      action: 'DOCTOR_PROFILE_DELETED',
      resource: 'Doctor',
      details: { doctorId: id, doctorName: doctor.name }
    }).catch(() => {});

    return doctor;
  }
}
