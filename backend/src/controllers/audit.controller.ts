import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';

export class AuditController {
  static async listLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AuditService.listLogs(req.clinicId!, req.query as any);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
