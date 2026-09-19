import { Router } from 'express';
import { ClinicController } from '../controllers/clinic.controller';
import { authenticateToken } from '../middlewares/auth';
import { enforceTenantIsolation } from '../middlewares/tenant';
import { requireRoles } from '../middlewares/rbac';

const router = Router();

router.use(authenticateToken, enforceTenantIsolation);

router.get(['/settings', '/'], ClinicController.getSettings);
router.put(['/settings', '/'], requireRoles('Owner', 'Admin'), ClinicController.updateSettings);

router.get('/profile', ClinicController.getProfile);
router.put('/profile', requireRoles('Owner', 'Admin'), ClinicController.updateProfile);
router.put('/working-hours', requireRoles('Owner', 'Admin'), ClinicController.updateWorkingHours);

export default router;
