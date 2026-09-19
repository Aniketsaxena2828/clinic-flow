import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await NotificationService.listNotifications(req.clinicId!);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(200).json({ success: true, data: [] });
    }
  }

  static async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await NotificationService.markRead(req.clinicId!, req.params.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await NotificationService.markAllRead(req.clinicId!);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await NotificationService.deleteNotification(req.clinicId!, req.params.id);
      res.status(200).json({ success: true, message: 'Notification deleted.' });
    } catch (error) {
      next(error);
    }
  }

  static async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prefs = await NotificationService.getPreferences(req.clinicId!, req.user?.userId);
      res.status(200).json({ success: true, data: prefs });
    } catch (error) {
      next(error);
    }
  }

  static async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prefs = await NotificationService.updatePreferences(req.clinicId!, req.user!.userId, req.body);
      res.status(200).json({ success: true, message: 'Notification preferences updated.', data: prefs });
    } catch (error) {
      next(error);
    }
  }
}
