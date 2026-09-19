import { Request, Response, NextFunction } from 'express';
import { ClinicService } from '../services/clinic.service';

export class ClinicController {
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clinic = await ClinicService.getClinicProfile(req.clinicId!);
      res.status(200).json({ success: true, data: clinic });
    } catch (error) {
      next(error);
    }
  }

  static async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await ClinicService.getClinicSettings(req.clinicId!);
      res.status(200).json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await ClinicService.updateClinicSettings(
        req.clinicId!,
        req.user!.userId,
        req.user!.email,
        req.body
      );
      res.status(200).json({ success: true, message: 'Settings saved and applied system-wide.', data: settings });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clinic = await ClinicService.updateClinicProfile(
        req.clinicId!,
        req.user!.userId,
        req.user!.email,
        req.body
      );
      res.status(200).json({ success: true, message: 'Clinic profile updated successfully.', data: clinic });
    } catch (error) {
      next(error);
    }
  }

  static async updateWorkingHours(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clinic = await ClinicService.updateWorkingHours(
        req.clinicId!,
        req.user!.userId,
        req.user!.email,
        req.body.workingHours
      );
      res.status(200).json({ success: true, message: 'Working hours updated.', data: clinic });
    } catch (error) {
      next(error);
    }
  }
}
