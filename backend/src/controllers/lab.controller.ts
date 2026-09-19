import { Request, Response, NextFunction } from 'express';
import { LabService } from '../services/lab.service';

export class LabController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await LabService.listOrders(req.clinicId!);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(200).json({ success: true, data: [] });
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await LabService.getOrderById(req.clinicId!, req.params.id);
      res.status(200).json({ success: true, data: order });
    } catch (error: any) {
      res.status(error.statusCode || 404).json({ success: false, message: error.message || 'Lab order not found.' });
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await LabService.createOrder(
        req.clinicId!,
        req.user?.userId || 'usr-1',
        req.user?.email || 'user@democlinic.com',
        req.body
      );
      res.status(201).json({ success: true, message: 'Lab order created.', data: order });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to create lab order.' });
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await LabService.updateOrder(
        req.clinicId!,
        req.params.id,
        req.user?.userId || 'usr-1',
        req.user?.email || 'user@democlinic.com',
        req.body
      );
      res.status(200).json({ success: true, message: 'Lab order updated.', data: order });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message || 'Failed to update lab order.' });
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await LabService.deleteOrder(
        req.clinicId!,
        req.params.id,
        req.user?.userId || 'usr-1',
        req.user?.email || 'user@democlinic.com'
      );
      res.status(200).json({ success: true, message: 'Lab order deleted.', data: order });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({ success: false, message: error.message || 'Failed to delete lab order.' });
    }
  }

  static async updateResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await LabService.updateResults(
        req.clinicId!,
        req.params.id,
        req.user?.userId || 'usr-1',
        req.user?.email || 'user@democlinic.com',
        req.body.results || req.body,
        req.body.notes
      );
      res.status(200).json({ success: true, message: 'Lab results updated.', data: order });
    } catch (error) {
      next(error);
    }
  }

  static async uploadReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await LabService.uploadReport(
        req.clinicId!,
        req.params.id,
        req.user?.userId || 'usr-1',
        req.user?.email || 'user@democlinic.com',
        req.body.reportUrl
      );
      res.status(200).json({ success: true, message: 'Lab report uploaded.', data: order });
    } catch (error) {
      next(error);
    }
  }
}
