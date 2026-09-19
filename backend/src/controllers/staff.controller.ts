import { Request, Response, NextFunction } from 'express';
import { StaffService } from '../services/staff.service';

export class StaffController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await StaffService.listStaff(req.clinicId!);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(200).json({ success: true, data: [] });
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await StaffService.createStaff(
        req.clinicId!,
        req.user?.userId || 'usr-1',
        req.user?.email || 'user@democlinic.com',
        req.body
      );
      res.status(201).json({ success: true, message: 'Staff member created.', data: staff });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to create staff member.' });
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await StaffService.updateStaff(
        req.clinicId!,
        req.params.id,
        req.user!.userId,
        req.user!.email,
        req.body
      );
      res.status(200).json({ success: true, message: 'Staff member updated.', data: staff });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await StaffService.deleteStaff(
        req.clinicId!,
        req.params.id,
        req.user!.userId,
        req.user!.email
      );
      res.status(200).json({ success: true, message: 'Staff member deleted.' });
    } catch (error) {
      next(error);
    }
  }
}
