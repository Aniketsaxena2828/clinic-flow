import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticateToken } from '../middlewares/auth';
import { enforceTenantIsolation } from '../middlewares/tenant';
import { requireRoles } from '../middlewares/rbac';

const router = Router();

router.use(authenticateToken, enforceTenantIsolation);

router.get('/', requireRoles('Owner', 'Admin'), AuditController.listLogs);

export default router;
