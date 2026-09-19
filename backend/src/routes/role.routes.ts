import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { authenticateToken } from '../middlewares/auth';
import { enforceTenantIsolation } from '../middlewares/tenant';
import { requireRoles } from '../middlewares/rbac';

const router = Router();

router.use(authenticateToken, enforceTenantIsolation);

router.get('/', RoleController.listRoles);
router.post('/', requireRoles('Owner', 'Admin'), RoleController.createRole);
router.put('/:id/permissions', requireRoles('Owner', 'Admin'), RoleController.updatePermissions);

export default router;
