import { PharmacyItem } from '../models/PharmacyItem';
import { AuditLog } from '../models/AuditLog';
import { NotificationService } from './notification.service';

export class PharmacyService {
  static async listInventory(clinicId: any) {
    return PharmacyItem.find({ clinicId }).sort({ createdAt: -1 });
  }

  static async addMedicine(clinicId: any, userId: string, userEmail: string, data: any) {
    const qty = Number(data.stockQuantity) || 0;
    const reorder = Number(data.reorderLevel) || 20;

    let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
    if (qty === 0) status = 'Out of Stock';
    else if (qty <= reorder) status = 'Low Stock';

    const item = await PharmacyItem.create({
      clinicId,
      name: data.name,
      brand: data.brand || data.manufacturer || 'Generic',
      category: data.category || 'General Medicine',
      unit: data.unit || 'Strip',
      batchNumber: data.batchNumber || `B-${Math.floor(10000 + Math.random() * 90000)}`,
      mfgDate: data.mfgDate,
      expiryDate: data.expiryDate || '2027-12-31',
      stockQuantity: qty,
      reorderLevel: reorder,
      purchasePrice: Number(data.purchasePrice) || 0,
      unitPrice: Number(data.unitPrice) || 0,
      mrp: Number(data.mrp) || Number(data.unitPrice) * 1.2,
      supplier: data.supplier,
      supplierContact: data.supplierContact,
      status
    }, clinicId);

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'MEDICINE_ADDED',
      resource: 'Pharmacy',
      details: { medicineName: item.name, batchNumber: item.batchNumber, stockQuantity: qty }
    }, clinicId).catch(() => {});

    if (qty <= reorder) {
      await NotificationService.createNotification(clinicId, {
        category: 'Pharmacy',
        title: qty === 0 ? `Out of Stock: ${item.name}` : `Low Stock Warning: ${item.name}`,
        message: `Medicine ${item.name} (Batch: ${item.batchNumber}) is ${status.toLowerCase()} with ${qty} ${item.unit} remaining (Reorder level: ${reorder}).`,
        priority: qty === 0 ? 'critical' : 'warning',
        actionUrl: '/pharmacy'
      });
    }

    return item;
  }

  static async updateMedicine(clinicId: any, itemId: string, userId: string, userEmail: string, data: any) {
    const item = await PharmacyItem.findOne({ _id: itemId, clinicId });
    if (!item) throw { statusCode: 404, message: 'Pharmacy item not found.' };

    const qty = data.stockQuantity !== undefined ? Number(data.stockQuantity) : item.stockQuantity;
    const reorder = data.reorderLevel !== undefined ? Number(data.reorderLevel) : item.reorderLevel;

    let status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 'In Stock';
    if (qty === 0) status = 'Out of Stock';
    else if (qty <= reorder) status = 'Low Stock';

    const cleanData = { ...data };
    delete cleanData.clinicId;
    delete cleanData.clinic_id;
    delete cleanData.id;
    delete cleanData._id;

    Object.assign(item, cleanData, { stockQuantity: qty, reorderLevel: reorder, status });
    await item.save();

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'MEDICINE_UPDATED',
      resource: 'Pharmacy',
      details: { medicineName: item.name, batchNumber: item.batchNumber }
    }, clinicId);

    return item;
  }

  static async updateStock(clinicId: any, itemId: string, userId: string, userEmail: string, newQty?: number, qtyChange?: number) {
    const item = await PharmacyItem.findOne({ _id: itemId, clinicId });
    if (!item) throw { statusCode: 404, message: 'Pharmacy item not found.' };

    let qty = item.stockQuantity;
    if (newQty !== undefined && !isNaN(newQty)) {
      qty = newQty;
    } else if (qtyChange !== undefined && !isNaN(qtyChange)) {
      qty = Math.max(0, qty + qtyChange);
    }

    item.stockQuantity = qty;
    if (qty === 0) item.status = 'Out of Stock';
    else if (qty <= item.reorderLevel) item.status = 'Low Stock';
    else item.status = 'In Stock';

    await item.save();

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'STOCK_ADJUSTED',
      resource: 'Pharmacy',
      details: { medicineName: item.name, newQty: qty, status: item.status }
    }, clinicId).catch(() => {});

    if (qty <= item.reorderLevel) {
      await NotificationService.createNotification(clinicId, {
        category: 'Pharmacy',
        title: qty === 0 ? `Out of Stock: ${item.name}` : `Low Stock Alert: ${item.name}`,
        message: `Stock level for ${item.name} is now ${qty} ${item.unit || 'units'} (Threshold: ${item.reorderLevel}). Reorder recommended.`,
        priority: qty === 0 ? 'critical' : 'warning',
        actionUrl: '/pharmacy'
      });
    }

    return item;
  }

  static async deleteMedicine(clinicId: any, itemId: string, userId: string, userEmail: string) {
    const item = await PharmacyItem.findOneAndDelete({ _id: itemId, clinicId });
    if (!item) throw { statusCode: 404, message: 'Pharmacy item not found.' };

    await AuditLog.create({
      clinicId,
      userId,
      userEmail,
      action: 'MEDICINE_DELETED',
      resource: 'Pharmacy',
      details: { medicineName: item.name }
    }, clinicId);

    return item;
  }
}
