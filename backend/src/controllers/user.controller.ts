import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  static async listStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await UserService.listStaffMembers(req.clinicId!, req.query as any);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async createStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await UserService.createStaffMember(
        req.clinicId!,
        req.user!.userId,
        req.user!.email,
        req.body
      );
      res.status(201).json({ success: true, message: 'Staff member registered successfully.', data: staff });
    } catch (error) {
      next(error);
    }
  }

  static async updateStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await UserService.updateStaffMember(
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

  static async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await UserService.toggleStaffStatus(
        req.clinicId!,
        req.params.id,
        req.body.status,
        req.user!.userId,
        req.user!.email
      );
      res.status(200).json({ success: true, message: `Staff status changed to ${req.body.status}.`, data: staff });
    } catch (error) {
      next(error);
    }
  }
}
