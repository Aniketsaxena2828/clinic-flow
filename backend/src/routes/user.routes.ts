import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken } from '../middlewares/auth';
import { enforceTenantIsolation } from '../middlewares/tenant';
import { requireRoles } from '../middlewares/rbac';

const router = Router();

router.use(authenticateToken, enforceTenantIsolation);

router.get('/', requireRoles('Owner', 'Admin'), UserController.listStaff);
router.post('/', requireRoles('Owner', 'Admin'), UserController.createStaff);
router.put('/:id', requireRoles('Owner', 'Admin'), UserController.updateStaff);
router.patch('/:id/status', requireRoles('Owner', 'Admin'), UserController.toggleStatus);

export default router;
