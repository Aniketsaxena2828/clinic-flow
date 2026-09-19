import { Bill } from '../models/Bill';
import { Patient } from '../models/Patient';
import { Doctor } from '../models/Doctor';
import { AuditLog } from '../models/AuditLog';
import { NotificationService } from './notification.service';

export class BillingService {
  /**
   * Generates sequential tenant-scoped Invoice Number (INV-2026-1001, INV-2026-1002...)
   */
  private static async generateInvoiceNumber(clinicId: string): Promise<string> {
    const count = await Bill.countDocuments({ clinicId });
    const currentYear = new Date().getFullYear();
    const seq = count + 1001;
    return `INV-${currentYear}-${seq}`;
  }

  static async listBills(clinicId: any) {
    return Bill.find({ clinicId }).sort({ createdAt: -1 });
  }

  static async getBillById(clinicId: any, id: string) {
    const bill = await Bill.findOne({
      clinicId,
      $or: [{ _id: id }, { invoiceNumber: id }]
    });
    if (!bill) {
      throw { statusCode: 404, message: 'Invoice not found.' };
    }
    return bill;
  }

  static async createBill(clinicId: any, userId: string, userEmail: string, data: any) {
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
    const patientPhone = patient?.phone || data.patientPhone || '+91 98765 43210';

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

    // 3. Process Items & Calculations
    const items = Array.isArray(data.items) && data.items.length > 0
      ? data.items.map((i: any) => ({
          description: i.description || 'Medical Service',
          category: i.category || 'Consultation',
          unitPrice: Number(i.unitPrice) || 0,
          quantity: Number(i.quantity) || 1,
          amount: (Number(i.unitPrice) || 0) * (Number(i.quantity) || 1)
        }))
      : [{ description: 'Outpatient Consultation Fee', category: 'Consultation', unitPrice: 800, quantity: 1, amount: 800 }];

    const calculatedSubtotal = items.reduce((sum: number, item: any) => sum + item.amount, 0);
    const subtotal = data.subtotal !== undefined ? Number(data.subtotal) : calculatedSubtotal;
    const gstRate = Number(data.gstRate) || 0;
    const gstAmount = Number(((subtotal * gstRate) / 100).toFixed(2));
    const discountAmount = Number(data.discountAmount) || 0;
    const totalAmount = Math.max(0, Number((subtotal + gstAmount - discountAmount).toFixed(2)));

    // 4. Initial Payment & Status
    const initialPaid = Number(data.paidAmount) || Number(data.initialPaidAmount) || 0;
    const balanceDue = Math.max(0, Number((totalAmount - initialPaid).toFixed(2)));

    let paymentStatus: 'Pending' | 'Partially Paid' | 'Paid' = 'Pending';
    if (balanceDue === 0 && totalAmount > 0) {
      paymentStatus = 'Paid';
    } else if (initialPaid > 0 && balanceDue > 0) {
      paymentStatus = 'Partially Paid';
    }

    const invoiceNumber = data.invoiceNumber && !data.invoiceNumber.includes('NaN')
      ? data.invoiceNumber
      : await this.generateInvoiceNumber(clinicId);

    const bill = await Bill.create({
      clinicId,
      invoiceNumber,
      patientId,
      patientName,
      patientPhone,
      doctorId,
      doctorName,
      items,
      subtotal,
      gstRate,
      gstAmount,
      discountAmount,
      totalAmount,
      paidAmount: initialPaid,
      balanceDue,
      paymentStatus,
      payments: initialPaid > 0 ? [{
        amountPaid: initialPaid,
        paymentMethod: data.paymentMethod || 'Cash',
        transactionRef: data.transactionRef || 'INITIAL-PAYMENT',
        paidAt: new Date()
      }] : [],
      dueDate: data.dueDate,
      notes: data.notes
    }, clinicId);

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'INVOICE_CREATED',
      resource: 'Bill',
      details: { invoiceNumber: bill.invoiceNumber, totalAmount, status: paymentStatus }
    }, clinicId).catch(() => {});

    await NotificationService.createNotification(clinicId, {
      category: 'Billing',
      title: 'New Invoice Generated',
      message: `Invoice #${bill.invoiceNumber} generated for ${patientName} (Total: ₹${totalAmount}, Status: ${paymentStatus}).`,
      priority: paymentStatus === 'Pending' && totalAmount > 5000 ? 'warning' : 'medium',
      actionUrl: '/billing'
    });

    return bill;
  }

  static async updateBill(clinicId: any, id: string, userId: string, userEmail: string, data: any) {
    const bill = await Bill.findOne({
      clinicId,
      $or: [{ _id: id }, { invoiceNumber: id }]
    });
    if (!bill) {
      throw { statusCode: 404, message: 'Invoice not found.' };
    }

    const cleanData = { ...data };
    delete cleanData.clinicId;
    delete cleanData.clinic_id;
    delete cleanData.id;
    delete cleanData._id;

    if (cleanData.items && Array.isArray(cleanData.items)) {
      cleanData.subtotal = cleanData.items.reduce((s: number, i: any) => s + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 1), 0);
      const gstRate = Number(cleanData.gstRate ?? bill.gstRate) || 0;
      cleanData.gstAmount = Number(((cleanData.subtotal * gstRate) / 100).toFixed(2));
      const discount = Number(cleanData.discountAmount ?? bill.discountAmount) || 0;
      cleanData.totalAmount = Math.max(0, Number((cleanData.subtotal + cleanData.gstAmount - discount).toFixed(2)));
      cleanData.balanceDue = Math.max(0, Number((cleanData.totalAmount - (bill.paidAmount || 0)).toFixed(2)));
      cleanData.paymentStatus = cleanData.balanceDue === 0 ? 'Paid' : (bill.paidAmount > 0 ? 'Partially Paid' : 'Pending');
    }

    const updated = await Bill.findByIdAndUpdate(bill.id || bill._id, cleanData, { new: true }, clinicId);

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'INVOICE_UPDATED',
      resource: 'Bill',
      details: { invoiceNumber: bill.invoiceNumber }
    }, clinicId).catch(() => {});

    return updated;
  }

  static async deleteBill(clinicId: any, id: string, userId: string, userEmail: string) {
    const bill = await Bill.findOne({
      clinicId,
      $or: [{ _id: id }, { invoiceNumber: id }]
    });
    if (!bill) {
      throw { statusCode: 404, message: 'Invoice not found.' };
    }

    await Bill.findOneAndDelete({ _id: bill.id || bill._id, clinicId });

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'INVOICE_DELETED',
      resource: 'Bill',
      details: { invoiceNumber: bill.invoiceNumber }
    }, clinicId).catch(() => {});

    return bill;
  }

  static async collectPayment(
    clinicId: any,
    billId: string,
    userId: string,
    userEmail: string,
    payment: { amountPaid: number; paymentMethod: string; transactionRef?: string; notes?: string }
  ) {
    const bill = await Bill.findOne({
      clinicId,
      $or: [{ _id: billId }, { invoiceNumber: billId }]
    });
    if (!bill) throw { statusCode: 404, message: 'Invoice not found.' };

    const collectAmount = Number(payment.amountPaid) || 0;
    const newPaidTotal = Number(((Number(bill.paidAmount) || 0) + collectAmount).toFixed(2));
    const newBalance = Math.max(0, Number(((Number(bill.totalAmount) || 0) - newPaidTotal).toFixed(2)));

    let newStatus: 'Pending' | 'Partially Paid' | 'Paid' = 'Pending';
    if (newBalance === 0 && bill.totalAmount > 0) {
      newStatus = 'Paid';
    } else if (newPaidTotal > 0) {
      newStatus = 'Partially Paid';
    }

    bill.paidAmount = newPaidTotal;
    bill.balanceDue = newBalance;
    bill.paymentStatus = newStatus;

    bill.payments = Array.isArray(bill.payments) ? bill.payments : [];
    bill.payments.push({
      amountPaid: collectAmount,
      paymentMethod: payment.paymentMethod as any,
      transactionRef: payment.transactionRef || `TXN-${Date.now()}`,
      notes: payment.notes,
      paidAt: new Date()
    });

    await bill.save();

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'PAYMENT_COLLECTED',
      resource: 'Bill',
      details: { invoiceNumber: bill.invoiceNumber, amountCollected: collectAmount, newStatus, remainingBalance: newBalance }
    }, clinicId).catch(() => {});

    await NotificationService.createNotification(clinicId, {
      category: 'Billing',
      title: 'Payment Received',
      message: `Payment of ₹${collectAmount} received for invoice #${bill.invoiceNumber} via ${payment.paymentMethod}. Remaining balance: ₹${newBalance}.`,
      priority: newStatus === 'Paid' ? 'success' : 'medium',
      actionUrl: '/billing'
    });

    return bill;
  }
}
