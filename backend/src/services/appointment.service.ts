import { Appointment } from '../models/Appointment';
import { Doctor } from '../models/Doctor';
import { Patient } from '../models/Patient';
import { AuditLog } from '../models/AuditLog';
import { NotificationService } from './notification.service';

export class AppointmentService {
  /**
   * Generates sequential token number per doctor & date (Token #1, #2, #3...)
   */
  private static async generateTokenNumber(clinicId: string, doctorId: string, date: string): Promise<number> {
    const count = await Appointment.countDocuments({ clinicId, doctorId, date });
    return count + 1;
  }

  /**
   * Generates unique appointment code (APT-1001)
   */
  private static async generateAppointmentId(clinicId: string): Promise<string> {
    const count = await Appointment.countDocuments({ clinicId });
    return `APT-${count + 1001}`;
  }

  static async listAppointments(
    clinicId: string,
    query: { date?: string; doctorId?: string; patientId?: string; status?: string }
  ) {
    const filter: any = { clinicId };
    if (query.date) filter.date = query.date;
    if (query.doctorId) filter.doctorId = query.doctorId;
    if (query.patientId) filter.patientId = query.patientId;
    if (query.status) filter.status = query.status;

    const appointments = await Appointment.find(filter)
      .sort({ date: -1, tokenNumber: 1 });

    return appointments;
  }

  static async bookAppointment(clinicId: string, userId: string, userEmail: string, data: any) {
    if (!clinicId) {
      throw { statusCode: 400, message: 'Tenant clinic ID is required.' };
    }
    if (!data.patientId && !data.patientName) {
      throw { statusCode: 400, message: 'Valid Patient ID or Patient Name is required.' };
    }

    // 1. Resolve Patient record
    let patient: any = null;
    if (data.patientId && data.patientId !== '[object Object]') {
      patient = await Patient.findOne({
        clinicId,
        $or: [{ _id: data.patientId }, { patientId: data.patientId }]
      }).catch(() => null);
    }
    if (!patient && data.patientPhone) {
      patient = await Patient.findOne({ clinicId, phone: data.patientPhone }).catch(() => null);
    }
    if (!patient && data.patientName) {
      patient = await Patient.findOne({ clinicId, name: data.patientName }).catch(() => null);
    }
    if (!patient && data.patientName) {
      // Auto-create patient record if not found but details provided
      patient = await Patient.create({
        clinicId,
        name: data.patientName,
        phone: data.patientPhone || '+91 98765 43210',
        gender: data.patientGender || 'Male',
        age: Number(data.patientAge) || 30,
        status: 'active'
      }, clinicId);
    }

    if (!patient) {
      throw { statusCode: 404, message: 'Patient not found. Please select or provide patient details.' };
    }

    // 2. Resolve Doctor record
    let doctor: any = null;
    if (data.doctorId && data.doctorId !== '[object Object]') {
      doctor = await Doctor.findOne({
        clinicId,
        $or: [{ _id: data.doctorId }, { email: data.doctorId }]
      }).catch(() => null);
    }
    if (!doctor && data.doctorName) {
      doctor = await Doctor.findOne({ clinicId, name: data.doctorName }).catch(() => null);
    }
    if (!doctor) {
      // Fallback: Pick the first active doctor for this clinic if none specified
      doctor = await Doctor.findOne({ clinicId, status: 'active' }).catch(() => null);
    }

    const patientId = patient.id || patient._id || patient.patientId || data.patientId;
    const patientName = patient.name || data.patientName || 'Registered Patient';
    const patientPhone = patient.phone || data.patientPhone || '+91 98765 43210';

    const doctorId = doctor ? (doctor.id || doctor._id || data.doctorId) : (data.doctorId || 'doc-default');
    const doctorName = doctor ? doctor.name : (data.doctorName || 'Attending Doctor');
    const doctorSpecialization = doctor?.specialization || data.doctorSpecialization || 'General Medicine';

    const todayDate = data.date || new Date().toISOString().split('T')[0];
    const tokenNumber = await this.generateTokenNumber(clinicId, doctorId.toString(), todayDate);
    const appointmentId = await this.generateAppointmentId(clinicId);

    const appointment = await Appointment.create({
      clinicId,
      appointmentId,
      patientId,
      patientName,
      patientPhone,
      doctorId,
      doctorName,
      doctorSpecialization,
      tokenNumber,
      date: todayDate,
      timeSlot: data.timeSlot || '10:00 AM',
      type: data.type || 'In-person',
      reasonForVisit: data.reasonForVisit || 'Routine Consultation',
      notes: data.notes || '',
      status: 'Scheduled',
      paymentStatus: 'Pending'
    }, clinicId);

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'APPOINTMENT_BOOKED',
      resource: 'Appointment',
      details: { appointmentId: appointment.appointmentId, tokenNumber, doctorName, patientName }
    }, clinicId).catch(() => {});

    await NotificationService.createNotification(clinicId, {
      category: 'Appointments',
      title: 'New Appointment Booked',
      message: `Appointment ${appointment.appointmentId} booked for ${patientName} with ${doctorName} on ${todayDate} at ${appointment.timeSlot || '10:00 AM'}.`,
      priority: 'medium',
      actionUrl: '/appointments'
    });

    return appointment;
  }

  static async updateStatus(clinicId: string, id: string, status: string, userId: string, userEmail: string) {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, clinicId },
      { status },
      { new: true }
    );

    if (!appointment) {
      throw { statusCode: 404, message: 'Appointment not found.' };
    }

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: `APPOINTMENT_${status.toUpperCase().replace(/\s+/g, '_')}`,
      resource: 'Appointment',
      details: { appointmentId: appointment.appointmentId, newStatus: status }
    }, clinicId).catch(() => {});

    const notifTitle = status === 'Checked-In'
      ? 'Patient Checked In'
      : status === 'Cancelled'
      ? 'Appointment Cancelled'
      : status === 'Completed'
      ? 'Appointment Completed'
      : `Appointment ${status}`;

    const notifPriority = status === 'Cancelled' ? 'medium' : 'low';

    await NotificationService.createNotification(clinicId, {
      category: 'Appointments',
      title: notifTitle,
      message: `${appointment.patientName || 'Patient'} status updated to "${status}" for appointment ${appointment.appointmentId}.`,
      priority: notifPriority,
      actionUrl: '/appointments'
    });

    return appointment;
  }

  static async reschedule(clinicId: string, id: string, date: string, timeSlot: string, userId: string, userEmail: string) {
    const appointment = await Appointment.findOne({ _id: id, clinicId });
    if (!appointment) {
      throw { statusCode: 404, message: 'Appointment not found.' };
    }

    const docId = (appointment.doctorId || '').toString();
    const newToken = await this.generateTokenNumber(clinicId, docId, date);
    appointment.date = date;
    appointment.timeSlot = timeSlot;
    appointment.tokenNumber = newToken;
    appointment.status = 'Scheduled';

    await appointment.save();

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'APPOINTMENT_RESCHEDULED',
      resource: 'Appointment',
      details: { appointmentId: appointment.appointmentId, newDate: date, newTimeSlot: timeSlot }
    }, clinicId).catch(() => {});

    await NotificationService.createNotification(clinicId, {
      category: 'Appointments',
      title: 'Appointment Rescheduled',
      message: `Appointment ${appointment.appointmentId} for ${appointment.patientName || 'Patient'} rescheduled to ${date} at ${timeSlot}.`,
      priority: 'medium',
      actionUrl: '/appointments'
    });

    return appointment;
  }
}
