import { Request, Response, NextFunction } from 'express';
import { BillingService } from '../services/billing.service';

export class BillingController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await BillingService.listBills(req.clinicId!);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(200).json({ success: true, data: [] });
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bill = await BillingService.getBillById(req.clinicId!, req.params.id);
      res.status(200).json({ success: true, data: bill });
    } catch (error: any) {
      res.status(error.statusCode || 404).json({ success: false, message: error.message || 'Invoice not found.' });
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bill = await BillingService.createBill(
        req.clinicId!,
        req.user?.userId || 'usr-1',
        req.user?.email || 'user@democlinic.com',
        req.body
      );
      res.status(201).json({ success: true, message: 'Invoice created successfully.', data: bill });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to create invoice.' });
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bill = await BillingService.updateBill(
        req.clinicId!,
        req.params.id,
        req.user?.userId || 'usr-1',
        req.user?.email || 'user@democlinic.com',
        req.body
      );
      res.status(200).json({ success: true, message: 'Invoice updated successfully.', data: bill });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message || 'Failed to update invoice.' });
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bill = await BillingService.deleteBill(
        req.clinicId!,
        req.params.id,
        req.user?.userId || 'usr-1',
        req.user?.email || 'user@democlinic.com'
      );
      res.status(200).json({ success: true, message: 'Invoice deleted successfully.', data: bill });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message || 'Failed to delete invoice.' });
    }
  }

  static async collectPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bill = await BillingService.collectPayment(
        req.clinicId!,
        req.params.id,
        req.user?.userId || 'usr-1',
        req.user?.email || 'user@democlinic.com',
        req.body
      );
      res.status(200).json({ success: true, message: 'Payment collected successfully.', data: bill });
    } catch (error) {
      next(error);
    }
  }
}
