import { Request, Response, NextFunction } from 'express';
import { Role } from '../models/Role';

export const requireRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(req.user.roleName)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Current role: ${req.user.roleName}`
      });
      return;
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      // Owner always has all permissions
      if (req.user.roleName === 'Owner') {
        return next();
      }

      // Check role permissions in DB or cache
      const role = await Role.findOne({
        name: req.user.roleName,
        $or: [{ clinicId: req.user.clinicId }, { isSystem: true }]
      });

      if (!role || !role.permissions.includes(permission)) {
        res.status(403).json({
          success: false,
          message: `Forbidden: Missing required permission [${permission}]`
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'RBAC Authorization check failed', error: error.message });
    }
  };
};
