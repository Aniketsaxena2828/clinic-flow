import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticateToken } from '../middlewares/auth';
import { enforceTenantIsolation } from '../middlewares/tenant';

const router = Router();

router.use(authenticateToken, enforceTenantIsolation);

router.get(['/dashboard', '/'], AnalyticsController.getDashboard);

export default router;
