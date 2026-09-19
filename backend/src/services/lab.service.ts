import { LabOrder } from '../models/LabOrder';
import { Patient } from '../models/Patient';
import { Doctor } from '../models/Doctor';
import { AuditLog } from '../models/AuditLog';
import { NotificationService } from './notification.service';

export class LabService {
  /**
   * Generates sequential tenant-scoped Lab Order ID (LAB-2026-1001, LAB-2026-1002...)
   */
  private static async generateOrderId(clinicId: string): Promise<string> {
    const count = await LabOrder.countDocuments({ clinicId });
    const currentYear = new Date().getFullYear();
    const seq = count + 1001;
    return `LAB-${currentYear}-${seq}`;
  }

  static async listOrders(clinicId: any) {
    return LabOrder.find({ clinicId }).sort({ createdAt: -1 });
  }

  static async getOrderById(clinicId: any, id: string) {
    const order = await LabOrder.findOne({
      clinicId,
      $or: [{ _id: id }, { orderId: id }]
    });
    if (!order) {
      throw { statusCode: 404, message: 'Lab order not found.' };
    }
    return order;
  }

  static async createOrder(clinicId: any, userId: string, userEmail: string, data: any) {
    if (!clinicId) {
      throw { statusCode: 400, message: 'Tenant clinic ID is required.' };
    }

    // 1. Resolve Patient
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

    const patientId = patient?.patientId || patient?.id || patient?._id || data.patientId || 'PAT-1001';
    const patientName = patient?.name || data.patientName || 'Registered Patient';

    // 2. Resolve Doctor
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

    const doctorId = doctor?.id || doctor?._id || data.doctorId;
    const doctorName = doctor?.name || data.doctorName || 'Attending Doctor';
    const orderId = data.orderId || await this.generateOrderId(clinicId);

    const order = await LabOrder.create({
      clinicId,
      orderId,
      patientId,
      patientName,
      doctorId,
      doctorName,
      testName: data.testName || 'Diagnostic Lab Investigation',
      category: data.category || 'Pathology',
      price: Number(data.price) || 500,
      sampleCollectedAt: data.sampleCollectedAt,
      reportUrl: data.reportUrl,
      status: data.status || 'Ordered',
      results: data.results || [],
      notes: data.notes || ''
    }, clinicId);

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'LAB_ORDER_CREATED',
      resource: 'LabOrder',
      details: { orderId: order.orderId, testName: order.testName, status: order.status }
    }, clinicId).catch(() => {});

    await NotificationService.createNotification(clinicId, {
      category: 'Lab',
      title: 'New Lab Order Created',
      message: `Lab order ${order.orderId} created for ${patientName} (${order.testName}).`,
      priority: 'medium',
      actionUrl: '/lab'
    });

    return order;
  }

  static async updateOrder(clinicId: any, id: string, userId: string, userEmail: string, data: any) {
    const order = await LabOrder.findOne({
      clinicId,
      $or: [{ _id: id }, { orderId: id }]
    });
    if (!order) {
      throw { statusCode: 404, message: 'Lab order not found.' };
    }

    const cleanData = { ...data };
    delete cleanData.clinicId;
    delete cleanData.clinic_id;
    delete cleanData.id;
    delete cleanData._id;

    const updated = await LabOrder.findByIdAndUpdate(order.id || order._id, cleanData, { new: true }, clinicId);

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'LAB_ORDER_UPDATED',
      resource: 'LabOrder',
      details: { orderId: order.orderId, newStatus: updated?.status }
    }, clinicId).catch(() => {});

    const newStatus = cleanData.status || updated?.status || order.status;
    const labTitle = newStatus === 'Sample Collected' || cleanData.sampleStatus === 'Sample Collected'
      ? 'Lab Sample Collected'
      : newStatus === 'Processing'
      ? 'Lab Specimen In Processing'
      : `Lab Order ${newStatus}`;

    await NotificationService.createNotification(clinicId, {
      category: 'Lab',
      title: labTitle,
      message: `Lab order ${order.orderId} (${order.testName}) for ${order.patientName || 'Patient'} updated to "${newStatus}".`,
      priority: 'low',
      actionUrl: '/lab'
    });

    return updated;
  }

  static async updateResults(clinicId: any, id: string, userId: string, userEmail: string, results: any[], notes?: string) {
    const order = await LabOrder.findOne({
      clinicId,
      $or: [{ _id: id }, { orderId: id }]
    });
    if (!order) throw { statusCode: 404, message: 'Lab order not found.' };

    order.results = results;
    if (notes !== undefined) order.notes = notes;
    order.status = 'Result Ready';
    await order.save();

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'LAB_RESULTS_ENTERED',
      resource: 'LabOrder',
      details: { orderId: order.orderId, status: 'Result Ready' }
    }, clinicId).catch(() => {});

    await NotificationService.createNotification(clinicId, {
      category: 'Lab',
      title: 'Lab Results Ready',
      message: `Test results entered for order ${order.orderId} (${order.testName}) - ${order.patientName}.`,
      priority: 'medium',
      actionUrl: '/lab'
    });

    return order;
  }

  static async uploadReport(clinicId: any, id: string, userId: string, userEmail: string, reportUrl: string) {
    const order = await LabOrder.findOne({
      clinicId,
      $or: [{ _id: id }, { orderId: id }]
    });
    if (!order) throw { statusCode: 404, message: 'Lab order not found.' };

    order.reportUrl = reportUrl;
    order.status = 'Report Uploaded';
    await order.save();

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'LAB_REPORT_UPLOADED',
      resource: 'LabOrder',
      details: { orderId: order.orderId, reportUrl, status: 'Report Uploaded' }
    }, clinicId).catch(() => {});

    await NotificationService.createNotification(clinicId, {
      category: 'Lab',
      title: 'Diagnostic Report Ready',
      message: `Official pathology/diagnostic report attached for order ${order.orderId} (${order.patientName}).`,
      priority: 'high',
      actionUrl: '/lab'
    });

    return order;
  }

  static async deleteOrder(clinicId: any, id: string, userId: string, userEmail: string) {
    const order = await LabOrder.findOne({
      clinicId,
      $or: [{ _id: id }, { orderId: id }]
    });
    if (!order) {
      throw { statusCode: 404, message: 'Lab order not found.' };
    }

    await LabOrder.findOneAndDelete({ _id: order.id || order._id, clinicId });

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'LAB_ORDER_DELETED',
      resource: 'LabOrder',
      details: { orderId: order.orderId }
    }, clinicId).catch(() => {});

    return order;
  }
}
