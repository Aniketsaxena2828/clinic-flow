import { Request, Response, NextFunction } from 'express';
import { PharmacyService } from '../services/pharmacy.service';

export class PharmacyController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await PharmacyService.listInventory(req.clinicId!);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(200).json({ success: true, data: [] });
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await PharmacyService.addMedicine(
        req.clinicId!,
        req.user?.userId || 'usr-1',
        req.user?.email || 'user@democlinic.com',
        req.body
      );
      res.status(201).json({ success: true, message: 'Pharmacy item added.', data: item });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to add medicine.' });
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await PharmacyService.updateMedicine(
        req.clinicId!,
        req.params.id,
        req.user!.userId,
        req.user!.email,
        req.body
      );
      res.status(200).json({ success: true, message: 'Pharmacy item updated.', data: item });
    } catch (error) {
      next(error);
    }
  }

  static async updateStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await PharmacyService.updateStock(
        req.clinicId!,
        req.params.id,
        req.user!.userId,
        req.user!.email,
        req.body.stockQuantity !== undefined ? Number(req.body.stockQuantity) : undefined,
        req.body.qtyChange !== undefined ? Number(req.body.qtyChange) : undefined
      );
      res.status(200).json({ success: true, message: 'Stock quantity updated.', data: item });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await PharmacyService.deleteMedicine(
        req.clinicId!,
        req.params.id,
        req.user!.userId,
        req.user!.email
      );
      res.status(200).json({ success: true, message: 'Pharmacy item deleted.' });
    } catch (error) {
      next(error);
    }
  }
}
