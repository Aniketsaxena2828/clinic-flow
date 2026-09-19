import { Request, Response, NextFunction } from 'express';
import { PrescriptionService } from '../services/prescription.service';

export class PrescriptionController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await PrescriptionService.listPrescriptions(req.clinicId!);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(200).json({ success: true, data: [] });
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rx = await PrescriptionService.createPrescription(
        req.clinicId!,
        req.user?.userId || 'usr-1',
        req.user?.email || 'user@democlinic.com',
        req.body
      );
      res.status(201).json({ success: true, message: 'Prescription created successfully.', data: rx });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to create prescription.' });
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rx = await PrescriptionService.updatePrescription(
        req.clinicId!,
        req.params.id,
        req.user!.userId,
        req.user!.email,
        req.body
      );
      res.status(200).json({ success: true, message: 'Prescription updated.', data: rx });
    } catch (error) {
      next(error);
    }
  }
}
