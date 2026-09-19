import { Request, Response, NextFunction } from 'express';
import { RoleService } from '../services/role.service';

export class RoleController {
  static async listRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await RoleService.listRoles(req.clinicId!);
      res.status(200).json({ success: true, data: roles });
    } catch (error) {
      next(error);
    }
  }

  static async createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await RoleService.createCustomRole(
        req.clinicId!,
        req.user!.userId,
        req.user!.email,
        req.body
      );
      res.status(201).json({ success: true, message: 'Custom role created.', data: role });
    } catch (error) {
      next(error);
    }
  }

  static async updatePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await RoleService.updateRolePermissions(
        req.clinicId!,
        req.params.id,
        req.user!.userId,
        req.user!.email,
        req.body.permissions
      );
      res.status(200).json({ success: true, message: 'Permissions updated.', data: role });
    } catch (error) {
      next(error);
    }
  }
}
