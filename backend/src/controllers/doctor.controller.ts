import { Request, Response, NextFunction } from 'express';
import { DoctorService } from '../services/doctor.service';

export class DoctorController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctors = await DoctorService.listDoctors(req.clinicId!, req.query as any);
      res.status(200).json({ success: true, data: doctors });
    } catch (error) {
      res.status(200).json({ success: true, data: [] });
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctor = await DoctorService.createDoctor(
        req.clinicId!,
        req.user?.userId || 'usr-1',
        req.user?.email || 'user@democlinic.com',
        req.body
      );
      res.status(201).json({ success: true, message: 'Doctor profile created.', data: doctor });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to create doctor profile.' });
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctor = await DoctorService.getDoctorById(req.clinicId!, req.params.id);
      res.status(200).json({ success: true, data: doctor });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctor = await DoctorService.updateDoctor(
        req.clinicId!,
        req.params.id,
        req.user!.userId,
        req.user!.email,
        req.body
      );
      res.status(200).json({ success: true, message: 'Doctor profile updated.', data: doctor });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctor = await DoctorService.deleteDoctor(
        req.clinicId!,
        req.params.id,
        req.user!.userId,
        req.user!.email
      );
      res.status(200).json({ success: true, message: 'Doctor profile deleted successfully.', data: doctor });
    } catch (error) {
      next(error);
    }
  }
}
