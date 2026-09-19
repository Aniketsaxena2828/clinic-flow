import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from '../services/department.service';

export class DepartmentController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = await DepartmentService.listDepartments(req.clinicId!);
      res.status(200).json({ success: true, data: departments });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dep = await DepartmentService.createDepartment(req.clinicId!, req.body);
      res.status(201).json({ success: true, message: 'Department created.', data: dep });
    } catch (error) {
      next(error);
    }
  }
}
